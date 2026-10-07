import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Award, BookOpen } from "lucide-react";

const AuthorBio = () => {
  return (
    <Card className="p-6 mt-12 bg-accent/30 border-l-4 border-primary">
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <Avatar className="h-16 w-16 border-2 border-primary/20">
          <AvatarImage src="/lovable-uploads/19dede89-c8f4-40b5-89f2-3484ea76ada7.png" alt="Mortgage Calculator Team" />
          <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">MC</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">About the Author</h4>
          </div>
          <p className="font-semibold text-lg">Mortgage Calculator Team</p>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
            <Award className="h-3.5 w-3.5" />
            Mortgage Industry Experts • 15+ Years Combined Experience
          </p>
          <p className="text-muted-foreground mb-4">
            Our team of licensed mortgage professionals and real estate experts has helped thousands of homebuyers navigate the complex world of home financing. We're dedicated to providing accurate, unbiased information to help you make the best financial decisions for your unique situation.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link 
              to="/about" 
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Learn more about us
            </Link>
            <Link 
              to="/contact" 
              className="text-sm font-medium text-primary hover:underline"
            >
              Contact our team →
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AuthorBio;
