import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ArrowRight, Crown } from 'lucide-react';

interface UpgradePromptProps {
  title: string;
  description: string;
  feature: string;
  compact?: boolean;
}

export function UpgradePrompt({
  title,
  description,
  feature,
  compact = false,
}: UpgradePromptProps) {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');

  if (compact) {
    return (
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
        <div className="flex items-center gap-3">
          <Crown className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium text-sm">{feature}</p>
            <p className="text-xs text-muted-foreground">
              Requires Professional plan
            </p>
          </div>
        </div>
        <Button asChild size="sm">
          <Link to="/pricing">
            Upgrade <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Crown className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl">{title}</CardTitle>
        </div>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={billingInterval === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBillingInterval('monthly')}
            >
              Monthly
            </Button>
            <Button
              variant={billingInterval === 'annual' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBillingInterval('annual')}
            >
              Annual
              <span className="ml-1 text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">
                Save $20
              </span>
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">
              ${billingInterval === 'monthly' ? '10' : '100'}
              <span className="text-sm font-normal text-muted-foreground">
                /{billingInterval === 'monthly' ? 'month' : 'year'}
              </span>
            </p>
            {billingInterval === 'annual' && (
              <p className="text-xs text-muted-foreground">$8.33/month billed annually</p>
            )}
          </div>
          <Button asChild>
            <Link to="/pricing">
              Upgrade Now <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
