import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Upload, Building2, Crown, Lock } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { ImageCropperDialog } from '@/components/ImageCropperDialog';
import { getCroppedImg, optimizeImage, CropArea } from '@/utils/imageProcessing';

interface Profile {
  full_name: string;
  company_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  logo_url: string | null;
  logo_aspect_ratio: string | null;
  nmls_license: string | null;
  company_address: string | null;
  website: string | null;
  title: string | null;
  work_email: string | null;
  company_phone: string | null;
  nmls_company: string | null;
  state_license_text: string | null;
}

export default function Settings() {
  const { user } = useAuth();
  const { subscription, isProfessional } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const isPro = isProfessional();
  
  const [profile, setProfile] = useState<Profile>({
    full_name: '',
    company_name: null,
    phone: null,
    avatar_url: null,
    logo_url: null,
    logo_aspect_ratio: '2:1',
    nmls_license: null,
    company_address: null,
    website: null,
    title: null,
    work_email: null,
    company_phone: null,
    nmls_company: null,
    state_license_text: null
  });
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cropType, setCropType] = useState<'avatar' | 'logo'>('avatar');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      if (data) setProfile(data);
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'avatar' | 'logo'
  ) => {
    // Gate logo uploads behind subscription
    if (type === 'logo' && !isPro) {
      toast({
        title: "Professional feature",
        description: "Upgrade to Professional to add your company logo.",
        variant: "destructive"
      });
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // FOR LOGOS: Skip cropper and upload directly
    if (type === 'logo') {
      await handleDirectLogoUpload(file);
      return;
    }

    // FOR AVATARS: Keep the cropper (profile pictures benefit from cropping)
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setSelectedFile(file);
      setCropType(type);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleDirectLogoUpload = async (file: File) => {
    setUploading(true);
    setIsProcessing(true);
    
    try {
      // Optimize the logo (auto-resize to max 2000px, compress to 0.5MB)
      const optimizedBlob = await optimizeImage(file, 'logo');
      
      const fileExt = 'jpg';
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, optimizedBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get signed URL
      const { data: urlData } = await supabase.storage
        .from('logos')
        .createSignedUrl(filePath, 31536000);

      if (urlData) {
        setProfile({ ...profile, logo_url: urlData.signedUrl });
        
        toast({
          title: "Success",
          description: "Company logo uploaded successfully",
        });
      }
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Error",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setIsProcessing(false);
    }
  };


  const handleCropComplete = async (croppedArea: CropArea, rotation: number) => {
    if (!selectedImage || !selectedFile) return;

    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(selectedImage, croppedArea, rotation);
      const optimizedBlob = await optimizeImage(croppedBlob, cropType);
      
      const fileExt = 'jpg';
      const fileName = `${Math.random()}.${fileExt}`;
      const bucketName = cropType === 'avatar' ? 'avatars' : 'logos';
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, optimizedBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 31536000);

      if (urlData) {
        const field = cropType === 'avatar' ? 'avatar_url' : 'logo_url';
        setProfile({ ...profile, [field]: urlData.signedUrl });
        
        toast({
          title: "Success",
          description: `${cropType === 'avatar' ? 'Profile picture' : 'Company logo'} uploaded successfully`,
        });
      }

      setCropDialogOpen(false);
      setSelectedImage(null);
      setSelectedFile(null);
    } catch (error: any) {
      console.error('Error processing image:', error);
      toast({
        title: "Error",
        description: "Failed to process image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        company_name: profile.company_name,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        logo_url: profile.logo_url,
        nmls_license: profile.nmls_license,
        company_address: profile.company_address,
        website: profile.website,
        title: profile.title,
        work_email: profile.work_email,
        company_phone: profile.company_phone,
        nmls_company: profile.nmls_company,
        state_license_text: profile.state_license_text
      })
      .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your changes have been saved"
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto">
          <div className="lg:col-span-8">
            <Card>
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-xl sm:text-2xl">Profile Settings</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Manage your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-6 sm:gap-8">
                <div className="flex flex-col items-center gap-2 w-full sm:w-auto">
                  <Label className="text-xs sm:text-sm font-medium">Profile Picture</Label>
                  <Avatar className="w-16 h-16 sm:w-20 sm:h-20">
                    <AvatarImage src={profile.avatar_url || ''} />
                    <AvatarFallback className="text-sm sm:text-base">
                      {profile.full_name?.charAt(0) || user?.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <Label htmlFor="avatar" className="cursor-pointer">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-primary hover:underline">
                      <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {uploading ? 'Uploading...' : 'Upload avatar'}
                    </div>
                  </Label>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'avatar')}
                    disabled={isProcessing}
                  />
                </div>

                <div className="flex flex-col items-center gap-2 w-full sm:w-auto">
                  <Label className="text-xs sm:text-sm font-medium flex items-center gap-2">
                    Company Logo
                    {!isPro && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  {isPro ? (
                    <>
                      <p className="text-xs text-muted-foreground text-center max-w-[200px]">
                        Upload your logo - it will be automatically resized to fit.
                      </p>
                      <div 
                        className="rounded-md border-2 border-muted overflow-hidden bg-muted flex items-center justify-center p-3 sm:p-4"
                        style={{ width: '180px', height: '135px' }}
                      >
                        {profile.logo_url ? (
                          <img 
                            src={profile.logo_url} 
                            alt="Company Logo" 
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <Building2 className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      
                      <Label htmlFor="logo" className="cursor-pointer">
                        <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                          <Upload className="w-4 h-4" />
                          {uploading ? 'Uploading...' : 'Upload logo'}
                        </div>
                      </Label>
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, 'logo')}
                        disabled={isProcessing}
                      />
                    </>
                  ) : (
                    <div className="p-4 bg-muted rounded-lg text-center" style={{ width: '180px' }}>
                      <Crown className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground mb-2">Professional feature</p>
                      <Button asChild size="sm" variant="outline">
                        <Link to="/pricing">Upgrade</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Job Title (Optional)</Label>
                <Input
                  id="title"
                  type="text"
                  value={profile.title || ''}
                  onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                  placeholder="e.g., Senior Loan Officer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="work_email" className="flex items-center gap-2">
                  Work Email
                  {!isPro && <Lock className="h-3 w-3 text-muted-foreground" />}
                </Label>
                <Input
                  id="work_email"
                  type="email"
                  value={profile.work_email || ''}
                  onChange={(e) => setProfile({ ...profile, work_email: e.target.value })}
                  placeholder={isPro ? "e.g., john@company.com" : "Professional feature"}
                  disabled={!isPro}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_name" className="flex items-center gap-2">
                  Company Name
                  {!isPro && <Lock className="h-3 w-3 text-muted-foreground" />}
                </Label>
                <Input
                  id="company_name"
                  type="text"
                  value={profile.company_name || ''}
                  onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                  disabled={!isPro}
                  placeholder={isPro ? "Your company name" : "Professional feature"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_phone" className="flex items-center gap-2">
                  Company Phone
                  {!isPro && <Lock className="h-3 w-3 text-muted-foreground" />}
                </Label>
                <Input
                  id="company_phone"
                  type="tel"
                  value={profile.company_phone || ''}
                  onChange={(e) => setProfile({ ...profile, company_phone: e.target.value })}
                  placeholder={isPro ? "e.g., (555) 123-4567" : "Professional feature"}
                  disabled={!isPro}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nmls_license">Personal NMLS# (Optional)</Label>
                <Input
                  id="nmls_license"
                  type="text"
                  value={profile.nmls_license || ''}
                  onChange={(e) => setProfile({ ...profile, nmls_license: e.target.value })}
                  placeholder="e.g., 123456"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nmls_company" className="flex items-center gap-2">
                  Company NMLS#
                  {!isPro && <Lock className="h-3 w-3 text-muted-foreground" />}
                </Label>
                <Input
                  id="nmls_company"
                  type="text"
                  value={profile.nmls_company || ''}
                  onChange={(e) => setProfile({ ...profile, nmls_company: e.target.value })}
                  placeholder={isPro ? "e.g., 789012" : "Professional feature"}
                  disabled={!isPro}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_address" className="flex items-center gap-2">
                  Company Address
                  {!isPro && <Lock className="h-3 w-3 text-muted-foreground" />}
                </Label>
                <Input
                  id="company_address"
                  type="text"
                  value={profile.company_address || ''}
                  onChange={(e) => setProfile({ ...profile, company_address: e.target.value })}
                  placeholder={isPro ? "e.g., 123 Main St, City, ST 12345" : "Professional feature"}
                  disabled={!isPro}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center gap-2">
                  Website or Loan Application Link
                  {!isPro && <Lock className="h-3 w-3 text-muted-foreground" />}
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={profile.website || ''}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  placeholder={isPro ? "e.g., https://www.company.com" : "Professional feature"}
                  disabled={!isPro}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state_license_text" className="flex items-center gap-2">
                  State License Information
                  {!isPro && <Lock className="h-3 w-3 text-muted-foreground" />}
                </Label>
                <Textarea
                  id="state_license_text"
                  value={profile.state_license_text || ''}
                  onChange={(e) => setProfile({ ...profile, state_license_text: e.target.value })}
                  placeholder={isPro ? "e.g., Licensed in CA, TX, FL under DRE #12345" : "Professional feature"}
                  disabled={!isPro}
                  rows={2}
                />
              </div>

              {!isPro && (
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Crown className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Unlock Company Branding</p>
                        <p className="text-xs text-muted-foreground">Add your logo, company info, and branding to PDFs</p>
                      </div>
                      <Button asChild size="sm">
                        <Link to="/pricing">Upgrade</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              </form>
            </CardContent>
            </Card>
          </div>

        </div>
      </main>

      <Footer />

      <ImageCropperDialog
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        image={selectedImage}
        cropType={cropType}
        aspectRatio={
          cropType === 'avatar' 
            ? 1 
            : profile.logo_aspect_ratio === '1:1' 
              ? 1 
              : profile.logo_aspect_ratio === '16:9' 
                ? 16/9 
                : profile.logo_aspect_ratio === '2:1' 
                  ? 2 
                  : undefined
        }
        onCropComplete={handleCropComplete}
        isProcessing={isProcessing}
      />
    </div>
  );
}
