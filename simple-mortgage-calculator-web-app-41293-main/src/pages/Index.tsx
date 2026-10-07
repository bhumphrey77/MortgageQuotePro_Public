import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2, RotateCcw, Download, Save, ArrowUp, Crown, Mail, X, ChevronDown, ClipboardCopy } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ToastAction } from '@/components/ui/toast';
import { buildQuoteText, copyQuoteText } from '@/utils/quoteTextExport';
import { CopyFallbackDialog } from '@/components/CopyFallbackDialog';
import MortgageCalculatorForm from '@/components/MortgageCalculatorForm';
import MortgageResultsSummary from '@/components/MortgageResultsSummary';
import AmortizationChart from '@/components/AmortizationChart';
import ScenarioComparison from '@/components/ScenarioComparison';
import DTICalculator from '@/components/DTICalculator';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';
import { calculateMonthlyPayment, calculateMonthlyPropertyTax, calculateMonthlyInsurance, calculateMonthlyPMI, calculateLTV, calculateRefinanceLTV, calculateAPR, formatCurrency, calculateFicoBasedPMI, LoanType } from '@/utils/calculatorUtils';
import { MortgageCalculatorInputs, MortgageResults, MortgageScenario } from '@/types/calculator';
import { useToast } from '@/hooks/use-toast';
import { generateMortgageQuotePdf } from '@/utils/mortgageQuotePdfExport';
import { cn } from '@/lib/utils';
import { EmailQuoteModal } from '@/components/EmailQuoteModal';
import { useEmailUsage } from '@/hooks/useEmailUsage';
import NaturalInputBar from '@/components/NaturalInputBar';
import type { CalcField } from '@/lib/naturalInput/applyExtraction';

// LocalStorage keys
const STORAGE_KEYS = {
  INPUTS: 'mortgage_calculator_inputs',
  SCENARIOS: 'mortgage_calculator_scenarios'
};

// Helper function to safely load data from localStorage
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// Helper function to safely save data to localStorage
const saveToStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};
const Index = () => {
  const { user } = useAuth();
  const { isProfessional, canSaveQuotes, canSaveScenarios, getMaxScenarios } = useSubscription();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  // Check if user is professional subscriber
  const isPro = isProfessional();

  // Save quote dialog state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [quoteName, setQuoteName] = useState('');
  const [savingQuote, setSavingQuote] = useState(false);
  
  // Edit quote state
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [editingQuoteName, setEditingQuoteName] = useState<string>('');
  const [updatingQuote, setUpdatingQuote] = useState(false);
  
  // Save scenario dialog state
  const [scenarioDialogOpen, setScenarioDialogOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioNotes, setScenarioNotes] = useState('');
  
  // Edit scenario state (for in-place updates)
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [editingScenarioName, setEditingScenarioName] = useState<string>('');
  
  // Email quote state
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const { emailsRemaining, refetch: refetchEmailUsage, timeUntilReset } = useEmailUsage();
  const [senderInfo, setSenderInfo] = useState<{
    name?: string;
    title?: string;
    company?: string;
    phone?: string;
    email?: string;
    nmls?: string;
  }>({});
  // Profile used for plain-text quote export (pre-fetched so clipboard call can run synchronously)
  const [quoteProfile, setQuoteProfile] = useState<{
    full_name?: string | null;
    company_name?: string | null;
    phone?: string | null;
    email?: string | null;
    nmls_license?: string | null;
  } | null>(null);
  // Fallback dialog state for when clipboard write is blocked
  const [copyFallbackOpen, setCopyFallbackOpen] = useState(false);

  // Fetch sender info from profile
  useEffect(() => {
    const fetchSenderInfo = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, title, company_name, phone, work_email, nmls_license')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setSenderInfo({
          name: profile.full_name || undefined,
          title: profile.title || undefined,
          company: profile.company_name || undefined,
          phone: profile.phone || undefined,
          email: profile.work_email || undefined,
          nmls: profile.nmls_license || undefined,
        });
        setQuoteProfile({
          full_name: profile.full_name,
          company_name: profile.company_name,
          phone: profile.phone,
          email: profile.work_email,
          nmls_license: profile.nmls_license,
        });
      }
    };
    
    fetchSenderInfo();
  }, [user]);
  
  // Back to top button state
  const [showBackToTop, setShowBackToTop] = useState(false);
  // Default calculator state
  const defaultInputs: MortgageCalculatorInputs = {
    calculatorMode: 'purchase',
    appraisedValue: 0,
    homePrice: 0,
    downPaymentAmount: 0,
    downPaymentPercentage: 0,
    interestRate: 0,
    loanTerm: 0,
    propertyTax: 0,
    propertyTaxRate: 0,
    homeInsurance: 0,
    homeInsuranceRate: 0,
    hoaFees: 0,
    estimatedClosingCosts: 0,
    includePMI: true,
    pmiRate: 0,
    pmiAmount: 0,
    ufmipRate: 0,
    ufmipAmount: 0,
    monthlyMipRate: 0,
    monthlyMipAmount: 0,
    fundingFeeRate: 0,
    fundingFeeAmount: 0,
    ugfRate: 0,
    ugfAmount: 0,
    agfRate: 0,
    agfAmount: 0,
    financeUpfrontFee: false,
    loanType: 'Conventional',
    dtiGrossIncome: '',
    dtiMonthlyDebts: '',
    ficoScore: 0,
    propertyAddress: '',
    existingFirstMortgageBalance: 0,
    interestOnlyYears: 10,
    existingFirstMortgagePI: 0
  };

  // Initialize state with data from localStorage
  const [inputs, setInputs] = useState<MortgageCalculatorInputs>(() => {
    const loadedInputs = loadFromStorage(STORAGE_KEYS.INPUTS, defaultInputs);
    // Backward compatibility: if calculatorMode doesn't exist, default to 'purchase'
    if (!loadedInputs.calculatorMode) {
      loadedInputs.calculatorMode = 'purchase';
    }
    return loadedInputs;
  });

  // Results state
  const [results, setResults] = useState<MortgageResults | null>(null);

  // Scenarios comparison state
  const [scenarios, setScenarios] = useState<MortgageScenario[]>(() => loadFromStorage(STORAGE_KEYS.SCENARIOS, []));

  // Ref for debouncing localStorage saves
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Generate scenario name based on loan type
  const generateScenarioName = (loanType: string) => {
    const baseName = `Scenario ${loanType}`;
    const existingCount = scenarios.filter(s => s.name.startsWith(baseName)).length;
    return existingCount > 0 ? `${baseName} ${existingCount + 1}` : baseName;
  };
  const currentScenarioName = generateScenarioName(inputs.loanType);

  // Track fields the user manually edited so Natural Input won't overwrite them.
  const [userTouchedFields, setUserTouchedFields] = useState<Set<CalcField>>(new Set());

  // Handle input changes - now triggers calculation immediately
  const handleInputChange = useCallback((name: keyof MortgageCalculatorInputs, value: number | boolean | string) => {
    setUserTouchedFields(prev => {
      if (prev.has(name)) return prev;
      const next = new Set(prev);
      next.add(name);
      return next;
    });
    setInputs(prev => {
      const newInputs = {
        ...prev,
        [name]: value
      };

      // Auto-calculate down payment percentage when amount changes
      if (name === 'downPaymentAmount' && typeof value === 'number') {
        const percentage = value / newInputs.homePrice * 100;
        newInputs.downPaymentPercentage = percentage;
      }

      // Auto-calculate down payment amount when percentage changes
      if (name === 'downPaymentPercentage' && typeof value === 'number') {
        const amount = value / 100 * newInputs.homePrice;
        newInputs.downPaymentAmount = amount;
      }

      // Recalculate down payment values when home price changes
      if (name === 'homePrice' && typeof value === 'number') {
        const amount = newInputs.downPaymentPercentage / 100 * value;
        newInputs.downPaymentAmount = amount;
      }
      return newInputs;
    });
  }, []);

  // Apply Natural Input extraction — bypasses touched-field tracking (uses its own protection).
  const applyNaturalInputPatch = useCallback(
    (patch: Partial<MortgageCalculatorInputs>, _appliedFields: CalcField[]) => {
      setInputs(prev => {
        const next = { ...prev, ...patch };
        // Auto-calculate FICO-based PMI for Conventional loans when LTV > 80%
        const isConventional = (next.loanType ?? LoanType.CONVENTIONAL) === LoanType.CONVENTIONAL;
        const fico = Number(next.ficoScore) || 0;
        const homePrice = Number(next.homePrice) || 0;
        const dpAmount = Number(next.downPaymentAmount) || 0;
        const loanAmount = Math.max(0, homePrice - dpAmount);
        const loanTerm = Number(next.loanTerm) || 30;
        if (isConventional && fico >= 300 && homePrice > 0 && loanAmount > 0) {
          const ltv = calculateLTV(homePrice, homePrice - loanAmount);
          if (ltv > 80) {
            const pmi = calculateFicoBasedPMI(loanAmount, ltv, fico, loanTerm);
            if (pmi) {
              next.pmiRate = pmi.annualRate * 100;
              next.pmiAmount = pmi.monthlyMI * 12;
            }
          } else {
            next.pmiRate = 0;
            next.pmiAmount = 0;
          }
        }
        return next;
      });
    },
    [],
  );

  // Helper to parse currency string to number
  const parseCurrencyToNumber = (value: string): number => {
    if (!value) return 0;
    return parseFloat(value.replace(/[$,]/g, '')) || 0;
  };

  // Calculate DTI results
  const calculateDTI = useCallback((totalHousingPayment: number): {
    frontEndDTI: number | null;
    backEndDTI: number | null;
  } => {
    const grossIncomeNum = parseCurrencyToNumber(inputs.dtiGrossIncome);
    const monthlyDebtsNum = parseCurrencyToNumber(inputs.dtiMonthlyDebts);
    if (!inputs.dtiGrossIncome || grossIncomeNum <= 0) {
      return {
        frontEndDTI: null,
        backEndDTI: null
      };
    }
    const frontEndDTI = totalHousingPayment / grossIncomeNum * 100;
    const backEndDTI = (totalHousingPayment + monthlyDebtsNum) / grossIncomeNum * 100;
    return {
      frontEndDTI,
      backEndDTI
    };
  }, [inputs.dtiGrossIncome, inputs.dtiMonthlyDebts]);

  // Calculate mortgage results
  const calculateResults = useCallback((): MortgageResults => {
    const isHeloc = inputs.loanType === 'HELOC/2nd Loan' && inputs.calculatorMode === 'refinance';

    // For refinance mode, loan amount is direct input; for purchase, it's calculated
    const baseLoanAmount = inputs.calculatorMode === 'refinance' 
      ? inputs.homePrice - inputs.downPaymentAmount  // In refinance mode, this represents the new loan amount
      : inputs.homePrice - inputs.downPaymentAmount;

    // Calculate upfront fee if financing is enabled (skip for HELOC)
    let upfrontFee = 0;
    if (inputs.financeUpfrontFee && !isHeloc) {
      if (inputs.loanType === 'FHA') {
        upfrontFee = inputs.ufmipAmount || baseLoanAmount * (inputs.ufmipRate / 100);
      } else if (inputs.loanType === 'VA') {
        upfrontFee = inputs.fundingFeeAmount || baseLoanAmount * (inputs.fundingFeeRate / 100);
      } else if (inputs.loanType === 'USDA') {
        upfrontFee = inputs.ugfAmount || baseLoanAmount * (inputs.ugfRate / 100);
      }
    }
    const loanAmount = baseLoanAmount + upfrontFee;

    // P&I calc — interest-only during IO period for HELOC, otherwise standard amortization
    let principalAndInterest: number;
    let postIoPayment: number | null = null;
    if (isHeloc) {
      const monthlyRate = inputs.interestRate / 100 / 12;
      const ioYears = Math.max(0, Math.min(inputs.interestOnlyYears, inputs.loanTerm));
      const amortYears = Math.max(1, inputs.loanTerm - ioYears);
      if (ioYears > 0) {
        principalAndInterest = loanAmount * monthlyRate;
        postIoPayment = calculateMonthlyPayment(loanAmount, inputs.interestRate, amortYears);
      } else {
        principalAndInterest = calculateMonthlyPayment(loanAmount, inputs.interestRate, inputs.loanTerm);
      }
    } else {
      principalAndInterest = calculateMonthlyPayment(loanAmount, inputs.interestRate, inputs.loanTerm);
    }

    // Calculate property tax - use dollar amount if specified, otherwise calculate from percentage
    const baseValueForTax = Math.max(inputs.appraisedValue, inputs.homePrice);
    const annualPropertyTax = inputs.propertyTax > 0 ? inputs.propertyTax : baseValueForTax * (inputs.propertyTaxRate / 100);
    const monthlyPropertyTax = calculateMonthlyPropertyTax(annualPropertyTax);

    // Calculate insurance - use dollar amount if specified, otherwise calculate from percentage
    const baseValueForInsurance = Math.max(inputs.appraisedValue, inputs.homePrice);
    const annualInsurance = inputs.homeInsurance > 0 ? inputs.homeInsurance : baseValueForInsurance * (inputs.homeInsuranceRate / 100);
    const monthlyInsurance = calculateMonthlyInsurance(annualInsurance);

    // Calculate PMI/MIP based on loan type (HELOC has none)
    let pmi = 0;
    if (isHeloc) {
      pmi = 0;
    } else if (inputs.loanType === 'Conventional') {
      // Use dollar amount if specified (divide by 12 for annual to monthly), otherwise calculate from percentage
      if (inputs.pmiAmount > 0) {
        pmi = inputs.downPaymentPercentage < 20 ? inputs.pmiAmount / 12 : 0;
      } else if (inputs.pmiRate > 0) {
        pmi = baseLoanAmount * (inputs.pmiRate / 100) / 12;
      }
    } else if (inputs.loanType === 'FHA') {
      pmi = inputs.monthlyMipAmount ? inputs.monthlyMipAmount / 12 : baseLoanAmount * (inputs.monthlyMipRate / 100) / 12;
    } else if (inputs.loanType === 'USDA') {
      pmi = inputs.agfAmount ? inputs.agfAmount / 12 : baseLoanAmount * (inputs.agfRate / 100) / 12;
    }

    // Calculate LTV / CLTV
    let ltv: number;
    let cltv: number | null = null;
    if (inputs.calculatorMode === 'refinance') {
      ltv = calculateRefinanceLTV(inputs.appraisedValue, baseLoanAmount);
      if (isHeloc && inputs.appraisedValue > 0) {
        cltv = ((inputs.existingFirstMortgageBalance + baseLoanAmount) / inputs.appraisedValue) * 100;
      }
    } else {
      const baseValueForLTV = Math.max(inputs.appraisedValue, inputs.homePrice);
      ltv = calculateLTV(baseValueForLTV, inputs.downPaymentAmount);
    }

    // Calculate APR including closing costs
    const apr = calculateAPR(loanAmount, inputs.estimatedClosingCosts, principalAndInterest, inputs.loanTerm);
    const totalMonthlyPayment = principalAndInterest + monthlyPropertyTax + monthlyInsurance + inputs.hoaFees + pmi;
    const existingPI = isHeloc ? Math.max(0, inputs.existingFirstMortgagePI || 0) : 0;
    const combinedTotalMonthlyPayment = isHeloc ? totalMonthlyPayment + existingPI : null;

    // Calculate DTI (use combined housing cost when HELOC so DTI reflects both liens)
    const safeNumber = (n: number) => (isFinite(n) ? n : 0);
    const dtiBase = combinedTotalMonthlyPayment ?? totalMonthlyPayment;
    const dtiResults = calculateDTI(safeNumber(dtiBase));
    return {
      principalAndInterest: safeNumber(principalAndInterest),
      propertyTax: monthlyPropertyTax,
      homeInsurance: monthlyInsurance,
      hoaFees: inputs.hoaFees,
      pmi: safeNumber(pmi),
      totalMonthlyPayment: safeNumber(totalMonthlyPayment),
      loanAmount: safeNumber(loanAmount),
      ltv: safeNumber(ltv),
      cltv: cltv == null ? null : safeNumber(cltv),
      apr: safeNumber(apr),
      estimatedClosingCosts: inputs.estimatedClosingCosts,
      postIoPayment: postIoPayment == null ? null : safeNumber(postIoPayment),
      existingFirstMortgagePI: isHeloc ? safeNumber(existingPI) : null,
      combinedTotalMonthlyPayment: combinedTotalMonthlyPayment == null ? null : safeNumber(combinedTotalMonthlyPayment),
      frontEndDTI: dtiResults.frontEndDTI,
      backEndDTI: dtiResults.backEndDTI
    };
  }, [inputs, calculateDTI]);

  // Recalculate whenever inputs change
  useEffect(() => {
    const newResults = calculateResults();
    setResults(newResults);
  }, [inputs, calculateResults]);

  // Debounced save to localStorage when inputs change
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveToStorage(STORAGE_KEYS.INPUTS, inputs);
    }, 500); // Save after 500ms of inactivity

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [inputs]);

  // Save scenarios to localStorage whenever they change
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SCENARIOS, scenarios);
  }, [scenarios]);

  // Back to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track which quote ID we've already loaded so we don't re-overwrite
  // unsaved edits when auth state re-emits (e.g., on tab focus / token refresh).
  const loadedQuoteIdRef = useRef<string | null>(null);

  // Load quote for editing from URL parameter
  useEffect(() => {
    const editQuoteId = searchParams.get('editQuote');

    // If the param was cleared, reset our tracker so re-entering edit mode
    // for the same quote later will load fresh data.
    if (!editQuoteId) {
      loadedQuoteIdRef.current = null;
      return;
    }

    // Only load once per quote ID. Without this guard, Supabase auth re-emits
    // (e.g. tab focus / token refresh) cause `user` to change reference and
    // re-run this effect, overwriting unsaved edits with the saved version.
    if (user && loadedQuoteIdRef.current !== editQuoteId) {
      loadedQuoteIdRef.current = editQuoteId;
      loadQuoteForEditing(editQuoteId);
    }
  }, [searchParams, user]);

  // Load quote data for editing
  const loadQuoteForEditing = async (quoteId: string) => {
    try {
      const { data, error } = await supabase
        .from('saved_quotes')
        .select('*')
        .eq('id', quoteId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setInputs(data.inputs as unknown as MortgageCalculatorInputs);
        setEditingQuoteId(quoteId);
        setEditingQuoteName(data.quote_name);
        toast({
          title: "Quote Loaded",
          description: `"${data.quote_name}" is ready for editing.`
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error: any) {
      toast({
        title: "Error loading quote",
        description: error.message,
        variant: "destructive"
      });
      // Clear the edit param if quote not found
      setSearchParams({});
    }
  };

  // Cancel editing mode
  const cancelEditMode = () => {
    setEditingQuoteId(null);
    setEditingQuoteName('');
    setSearchParams({});
    toast({
      title: "Edit Cancelled",
      description: "Changes were not saved."
    });
  };

  // Update existing quote
  const handleUpdateQuote = async () => {
    if (!editingQuoteId || !results) return;
    
    setUpdatingQuote(true);
    try {
      const { error } = await supabase
        .from('saved_quotes')
        .update({
          inputs: inputs as any,
          results: results as any,
          quote_name: editingQuoteName
        })
        .eq('id', editingQuoteId);
      
      if (error) throw error;
      
      toast({
        title: "Quote Updated",
        description: `"${editingQuoteName}" has been saved.`
      });
      
      setEditingQuoteId(null);
      setEditingQuoteName('');
      setSearchParams({});
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUpdatingQuote(false);
    }
  };

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save the current scenario - opens dialog
  const saveScenario = () => {
    if (!results) return;
    
    // Check subscription for scenario saving
    if (!canSaveScenarios()) {
      toast({
        title: "Professional Feature",
        description: "Subscribe to Professional to save and compare scenarios.",
        variant: "destructive"
      });
      return;
    }
    
    const maxScenarios = getMaxScenarios();
    if (scenarios.length >= maxScenarios) {
      toast({
        title: "Maximum Scenarios Reached",
        description: `You can compare up to ${maxScenarios} scenarios. Please remove one to add another.`,
        variant: "destructive"
      });
      return;
    }
    
    // Open dialog with default name and empty notes
    setScenarioName(currentScenarioName);
    setScenarioNotes('');
    setScenarioDialogOpen(true);
  };

  // Handle scenario save confirmation from dialog
  const handleSaveScenarioConfirm = () => {
    const newScenario: MortgageScenario = {
      id: uuidv4(),
      name: scenarioName.trim() || currentScenarioName,
      inputs: {
        ...inputs
      },
      results: {
        ...results
      },
      specialNotes: scenarioNotes.trim() || undefined
    };
    setScenarios(prev => [...prev, newScenario]);
    setScenarioDialogOpen(false);
    setScenarioName('');
    setScenarioNotes('');
    
    toast({
      title: "Scenario Saved",
      description: `${newScenario.name} has been saved for comparison.`
    });
  };

  // Load a scenario for editing (in-place)
  const loadScenarioForEditing = (scenario: MortgageScenario) => {
    setInputs(scenario.inputs);
    setEditingScenarioId(scenario.id);
    setEditingScenarioName(scenario.name);
    toast({
      title: "Scenario Loaded",
      description: `Editing "${scenario.name}". Update to save in-place or Save as New.`
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel scenario editing
  const cancelScenarioEditMode = () => {
    setEditingScenarioId(null);
    setEditingScenarioName('');
    toast({
      title: "Edit Cancelled",
      description: "Scenario changes were discarded."
    });
  };

  // Update existing scenario in-place
  const handleUpdateScenario = () => {
    if (!editingScenarioId || !results) return;
    setScenarios(prev => prev.map(s => s.id === editingScenarioId ? {
      ...s,
      inputs: { ...inputs },
      results: { ...results },
    } : s));
    toast({
      title: "Scenario Updated",
      description: `"${editingScenarioName}" has been updated.`
    });
    setEditingScenarioId(null);
    setEditingScenarioName('');
  };

  // Save as new scenario (while in edit mode)
  const handleSaveScenarioAsNew = () => {
    setEditingScenarioId(null);
    setEditingScenarioName('');
    saveScenario();
  };

  // Update scenario name and notes only
  const updateScenarioDetails = (id: string, name: string, specialNotes: string) => {
    setScenarios(prev => prev.map(s => s.id === id ? { ...s, name, specialNotes: specialNotes || undefined } : s));
    toast({
      title: "Scenario Updated",
      description: `"${name}" has been updated.`
    });
  };

  // Remove a scenario
  const removeScenario = (id: string) => {
    setScenarios(prev => prev.filter(scenario => scenario.id !== id));
    toast({
      title: "Scenario Removed",
      description: "The scenario has been removed from comparison."
    });
  };

  // Clear all saved data and reset to defaults
  const clearAllData = () => {
    setInputs(defaultInputs);
    setScenarios([]);
    localStorage.removeItem(STORAGE_KEYS.INPUTS);
    localStorage.removeItem(STORAGE_KEYS.SCENARIOS);
    toast({
      title: "Data Cleared",
      description: "All saved data has been reset to defaults."
    });
  };

  // Export to PDF
  const handleExportPDF = async () => {
    if (!results) {
      toast({
        title: "No Data to Export",
        description: "Please complete the mortgage calculation first.",
        variant: "destructive"
      });
      return;
    }
    try {
      // Fetch user profile if authenticated
      let userProfile = undefined;
      if (user) {
        const {
          data: profileData
        } = await supabase.from('profiles').select('avatar_url, logo_url, full_name, email, company_name, phone, nmls_license, company_address, website').eq('id', user.id).single();
        if (profileData) {
          userProfile = profileData;
        }
      }
      await generateMortgageQuotePdf({
        inputs,
        results,
        scenarios,
        userProfile
      });
      toast({
        title: "PDF Generated",
        description: "Your mortgage calculation report has been downloaded."
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Export Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Pre-build the plain-text quote so the clipboard call can run synchronously
  // inside the user-gesture handler (critical for mobile Safari/Chrome).
  const quoteText = useMemo(() => {
    if (!results) return '';
    return buildQuoteText({ inputs, results, userProfile: quoteProfile });
  }, [inputs, results, quoteProfile]);

  // Copy plain-text quote to clipboard. NOTE: do not `await` anything before
  // calling copyQuoteText — that would drop the user-activation token.
  const handleCopyAsText = () => {
    if (!results || !quoteText) {
      toast({
        title: "No Data to Copy",
        description: "Please complete the mortgage calculation first.",
        variant: "destructive"
      });
      return;
    }

    const tryCopy = () => {
      // Fire-and-handle: copyQuoteText returns a Promise but we don't await
      // before calling it, so the initial clipboard API call still runs in
      // the gesture's synchronous frame.
      copyQuoteText(quoteText).then((ok) => {
        if (ok) {
          toast({
            title: "Copied to Clipboard",
            description: "Paste it into a text message, email, or chat.",
            action: (
              <ToastAction altText="Copy again" onClick={tryCopy}>
                Copy again
              </ToastAction>
            ),
          });
        } else {
          // Programmatic copy blocked — open manual-copy fallback
          setCopyFallbackOpen(true);
        }
      }).catch(() => {
        setCopyFallbackOpen(true);
      });
    };

    tryCopy();
  };
  const handleSaveQuote = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save your quotes",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }
    
    // Check subscription for quote saving
    if (!canSaveQuotes()) {
      toast({
        title: "Professional Feature",
        description: "Subscribe to Professional to save unlimited quotes.",
        variant: "destructive"
      });
      navigate('/pricing');
      return;
    }
    
    if (!results) {
      toast({
        title: "No calculation to save",
        description: "Please enter values and calculate first",
        variant: "destructive"
      });
      return;
    }
    setQuoteName('');
    setSaveDialogOpen(true);
  };
  const handleSaveQuoteConfirm = async () => {
    if (!quoteName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your quote",
        variant: "destructive"
      });
      return;
    }
    setSavingQuote(true);
    try {
      const {
        error
      } = await supabase.from('saved_quotes').insert({
        user_id: user?.id,
        quote_name: quoteName.trim(),
        inputs: inputs as any,
        results: results as any
      });
      if (error) throw error;
      toast({
        title: "Quote saved!",
        description: "Your mortgage quote has been saved to your dashboard"
      });
      setSaveDialogOpen(false);
      setQuoteName('');
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSavingQuote(false);
    }
  };
  return <div className="min-h-screen bg-theme-bg flex flex-col transition-colors duration-300">
      <SEO
        title="Mortgage Calculator with PMI &amp; Taxes | Mortgage Quote Pro"
        description="Free mortgage calculator with PMI, taxes &amp; insurance. Compare scenarios, calculate DTI, and export professional PDFs for purchase or refinance."
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Mortgage Quote Pro Calculator",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Web",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <Navigation />

      <main className="flex-1 container mx-auto px-4 sm:px-6 mt-4 sm:mt-6 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 border border-theme-primary/10">

        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-3 sm:pb-4 mb-2 border-b border-gray-200/50">
          {editingQuoteId ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs text-primary font-medium uppercase tracking-wide">Editing Quote</p>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold">{editingQuoteName}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  onClick={handleUpdateQuote} 
                  disabled={updatingQuote}
                  className="flex items-center gap-2"
                >
                  <Save size={16} />
                  {updatingQuote ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setEditingQuoteId(null);
                    setEditingQuoteName('');
                    setSearchParams({});
                    handleSaveQuote();
                  }}
                  className="flex items-center gap-2"
                >
                  Save as New
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={cancelEditMode}
                  className="flex items-center gap-2"
                >
                  <X size={16} />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold">
              {inputs.calculatorMode === 'refinance' ? 'Calculate Your Refinance Payment' : 'Calculate Your Monthly Payment'}
            </h2>
          )}
        </div>

        {/* Mobile action buttons - shown only on mobile, below heading, when NOT editing */}
        {results && !editingQuoteId && (
          <div className="lg:hidden flex flex-wrap gap-2 mb-4 pb-3 border-b border-gray-200/50">
            {user ? (
              isPro ? (
                <Button variant="outline" size="sm" onClick={handleSaveQuote} className="flex items-center gap-2 text-xs sm:text-sm">
                  <Save size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Save Quote</span>
                  <span className="sm:hidden">Save</span>
                </Button>
              ) : (
                <Button variant="outline" size="sm" asChild className="flex items-center gap-2 text-xs sm:text-sm">
                  <Link to="/pricing">
                    <Crown size={14} className="sm:w-4 sm:h-4 text-primary" />
                    <span className="hidden sm:inline">Upgrade to Save Quote</span>
                    <span className="sm:hidden">Upgrade</span>
                  </Link>
                </Button>
              )
            ) : (
              <Button variant="outline" size="sm" asChild className="flex items-center gap-2 text-xs sm:text-sm">
                <Link to="/pricing">
                  <Crown size={14} className="sm:w-4 sm:h-4 text-primary" />
                  <span className="hidden sm:inline">Upgrade to Save Quote</span>
                  <span className="sm:hidden">Upgrade</span>
                </Link>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2 text-xs">
                  <Download size={16} />
                  Export
                  <ChevronDown size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportPDF}>
                  <Download size={14} className="mr-2" /> Export PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyAsText}>
                  <ClipboardCopy size={14} className="mr-2" /> Copy as Text
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={() => setEmailModalOpen(true)} className="flex items-center gap-2 text-xs">
              <Mail size={16} />
              Email Results
            </Button>
            <Button variant="outline" size="sm" onClick={clearAllData} className="flex items-center gap-2 text-xs">
              <RotateCcw size={16} />
              Clear All
            </Button>
          </div>
        )}
        
        {/* Natural Input (AI-powered scenario extraction) */}
        <NaturalInputBar
          currentInputs={inputs}
          protectedFields={userTouchedFields}
          onApplyPatch={applyNaturalInputPatch}
          onReset={() => setUserTouchedFields(new Set())}
        />

        {/* Top section: Input and Results side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Left column: Calculator form (condensed) */}
          <div className="lg:col-span-5 xl:col-span-4">
            <MortgageCalculatorForm inputs={inputs} onInputChange={handleInputChange} onCalculate={() => {}} // Empty function as we no longer need the button
          isCalculating={false} condensed={true} reactiveMode={true} // New prop to indicate we're in reactive mode
          />
          </div>
          
          {/* Middle column: Results summary */}
          <div className="lg:col-span-5 xl:col-span-6">
            {results && <div className="sticky top-[100px] sm:top-[120px] z-30">
                {/* Action buttons - hidden on mobile, shown on desktop */}
                <div className="hidden lg:flex flex-wrap items-center justify-between gap-2 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-200/50">
                  <div className="flex flex-wrap gap-2">
                    {user ? (
                      isPro ? (
                        <Button variant="outline" size="sm" onClick={handleSaveQuote} className="flex items-center gap-2 text-xs sm:text-sm">
                          <Save size={14} className="sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Save Quote</span>
                          <span className="sm:hidden">Save</span>
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" asChild className="flex items-center gap-2 text-xs sm:text-sm">
                          <Link to="/pricing">
                            <Crown size={14} className="sm:w-4 sm:h-4 text-primary" />
                            <span className="hidden sm:inline">Upgrade to Save Quote</span>
                            <span className="sm:hidden">Upgrade</span>
                          </Link>
                        </Button>
                      )
                    ) : (
                      <Button variant="outline" size="sm" asChild className="flex items-center gap-2 text-xs sm:text-sm">
                        <Link to="/pricing">
                          <Crown size={14} className="sm:w-4 sm:h-4 text-primary" />
                          <span className="hidden sm:inline">Upgrade to Save Quote</span>
                          <span className="sm:hidden">Upgrade</span>
                        </Link>
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-2 text-xs">
                          <Download size={16} />
                          Export
                          <ChevronDown size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleExportPDF}>
                          <Download size={14} className="mr-2" /> Export PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleCopyAsText}>
                          <ClipboardCopy size={14} className="mr-2" /> Copy as Text
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" size="sm" onClick={() => setEmailModalOpen(true)} className="flex items-center gap-2 text-xs">
                      <Mail size={16} />
                      Email Results
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearAllData} className="flex items-center gap-2 text-xs">
                      <RotateCcw size={16} />
                      Clear All
                    </Button>
                  </div>
                </div>
                
                <MortgageResultsSummary results={results} inputs={inputs} />
                
                {/* Scenario saving controls */}
                <div className="flex flex-wrap items-center justify-between mt-4 gap-2">
                  {isPro ? (
                    <Button onClick={saveScenario} className="flex items-center" variant="accent" disabled={scenarios.length >= getMaxScenarios()}>
                      <PlusCircle size={16} className="mr-2" />
                      Save as {currentScenarioName}
                    </Button>
                  ) : (
                    <Button variant="outline" asChild className="flex items-center">
                      <Link to="/pricing">
                        <Crown size={16} className="mr-2 text-primary" />
                        Upgrade to Compare Scenarios
                      </Link>
                    </Button>
                  )}
                  
                  {scenarios.length > 0 && <div className="flex flex-wrap gap-2">
                      {scenarios.map(scenario => <div key={scenario.id} className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                          <span className="text-sm">{scenario.name}</span>
                          <Button variant="ghost" size="icon" onClick={() => removeScenario(scenario.id)} className="ml-1 h-6 w-6 text-gray-500 hover:text-red-500">
                            <Trash2 size={14} />
                          </Button>
                        </div>)}
                    </div>}
                </div>
              </div>}
          </div>

        </div>
        
        {/* Scenario comparison */}
        {scenarios.length > 0 && <div className="mt-6">
            <ScenarioComparison 
              scenarios={scenarios} 
              onEditScenario={loadScenarioForEditing}
              onRemoveScenario={removeScenario}
              onUpdateScenarioDetails={updateScenarioDetails}
              editingScenarioId={editingScenarioId}
              onUpdateScenario={handleUpdateScenario}
              onSaveAsNew={handleSaveScenarioAsNew}
              onCancelScenarioEdit={cancelScenarioEditMode}
            />
          </div>}
        
        {/* DTI Calculator */}
        <div className="mt-6">
          <DTICalculator totalHousingPayment={results?.totalMonthlyPayment} grossIncome={inputs.dtiGrossIncome} monthlyDebts={inputs.dtiMonthlyDebts} onGrossIncomeChange={value => handleInputChange('dtiGrossIncome', value)} onMonthlyDebtsChange={value => handleInputChange('dtiMonthlyDebts', value)} frontEndDTI={results?.frontEndDTI ?? null} backEndDTI={results?.backEndDTI ?? null} />
        </div>
        
        {/* Bottom section: Amortization chart */}
        {results && <div className="mt-6">
            <AmortizationChart loanAmount={results.loanAmount} interestRate={inputs.interestRate} loanTerm={inputs.loanTerm} />
          </div>}


        {/* Back to Top Button */}
        {showBackToTop && (
          <Button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 shadow-lg rounded-full w-12 h-12 p-0"
            variant="default"
            aria-label="Back to top"
          >
            <ArrowUp size={20} />
          </Button>
        )}
      </main>

      <Footer />

      {/* Save Quote Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Mortgage Quote</DialogTitle>
            <DialogDescription>
              Give your quote a name to save it to your dashboard
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quote-name">Quote Name</Label>
              <Input id="quote-name" placeholder="e.g., Main Street Property" value={quoteName} onChange={e => setQuoteName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveQuoteConfirm()} />
            </div>
            <div className="text-sm text-muted-foreground">
              <p><strong>Home Price:</strong> {results && formatCurrency(results.loanAmount + inputs.downPaymentAmount)}</p>
              <p><strong>Monthly Payment:</strong> {results && formatCurrency(results.totalMonthlyPayment)}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuoteConfirm} disabled={savingQuote}>
              {savingQuote ? 'Saving...' : 'Save Quote'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Scenario Dialog */}
      <Dialog open={scenarioDialogOpen} onOpenChange={setScenarioDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Scenario</DialogTitle>
            <DialogDescription>
              Give your scenario a name and add any special notes for reference.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="scenario-name">Scenario Name</Label>
              <Input
                id="scenario-name"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="e.g., 30-Year Fixed, Best Rate"
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSaveScenarioConfirm()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scenario-notes">Special Notes</Label>
              <Textarea
                id="scenario-notes"
                value={scenarioNotes}
                onChange={(e) => setScenarioNotes(e.target.value)}
                placeholder="Add any notes about this scenario..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScenarioDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveScenarioConfirm}>
              Save Scenario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Email Quote Modal */}
      <EmailQuoteModal
        open={emailModalOpen}
        onOpenChange={(open) => {
          setEmailModalOpen(open);
          if (!open) refetchEmailUsage();
        }}
        calculatorType="mortgage"
        quoteData={{
          propertyAddress: inputs.propertyAddress,
          salesPrice: inputs.homePrice,
          downPayment: inputs.downPaymentAmount,
          downPaymentPercent: inputs.downPaymentPercentage,
          loanAmount: results?.loanAmount,
          loanType: inputs.loanType,
          interestRate: inputs.interestRate,
          loanTerm: inputs.loanTerm,
          monthlyPayment: results?.principalAndInterest,
          propertyTax: results?.propertyTax,
          homeInsurance: results?.homeInsurance,
          pmi: results?.pmi,
          hoaFees: results?.hoaFees,
          totalMonthlyPayment: results?.totalMonthlyPayment,
          estimatedClosingCosts: inputs.estimatedClosingCosts,
          ficoScore: inputs.ficoScore,
          apr: results?.apr,
          frontEndDTI: results?.frontEndDTI,
          backEndDTI: results?.backEndDTI,
        }}
        senderInfo={senderInfo}
        emailsRemaining={emailsRemaining}
        isProfessional={isPro}
        timeUntilReset={timeUntilReset.formatted}
        user={user}
      />
      <CopyFallbackDialog
        open={copyFallbackOpen}
        onOpenChange={setCopyFallbackOpen}
        text={quoteText}
      />
    </div>;
};
export default Index;