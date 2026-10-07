
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Trash2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer } from
'recharts';
import { MortgageScenario } from '@/types/calculator';
import { formatCurrency } from '@/utils/calculatorUtils';

interface ScenarioComparisonProps {
  scenarios: MortgageScenario[];
  onEditScenario: (scenario: MortgageScenario) => void;
  onRemoveScenario: (id: string) => void;
  onUpdateScenarioDetails?: (id: string, name: string, specialNotes: string) => void;
  editingScenarioId?: string | null;
  onUpdateScenario?: () => void;
  onSaveAsNew?: () => void;
  onCancelScenarioEdit?: () => void;
}

interface ChartData {
  name: string;
  [key: string]: string | number;
}

const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({ scenarios, onEditScenario, onRemoveScenario, onUpdateScenarioDetails, editingScenarioId, onUpdateScenario, onSaveAsNew, onCancelScenarioEdit }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const startEditing = (scenario: MortgageScenario) => {
    setEditingId(scenario.id);
    setEditName(scenario.name);
    setEditNotes(scenario.specialNotes || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
    setEditNotes('');
  };

  const saveEditing = () => {
    if (editingId && editName.trim() && onUpdateScenarioDetails) {
      onUpdateScenarioDetails(editingId, editName.trim(), editNotes.trim());
    }
    setEditingId(null);
  };

  if (scenarios.length === 0) {
    return null;
  }

  // Prepare data for the charts
  const monthlyCostData: ChartData[] = [
  {
    name: 'Monthly Payment',
    ...scenarios.reduce((acc, scenario) => {
      acc[scenario.name] = scenario.results.totalMonthlyPayment;
      return acc;
    }, {} as Record<string, number>)
  }];


  const breakdownData: ChartData[] = [
  { name: 'Principal & Interest' },
  { name: 'Property Tax' },
  { name: 'Insurance' },
  { name: 'HOA Fees' },
  { name: 'PMI' }];


  // Populate the breakdown data
  breakdownData.forEach((item) => {
    scenarios.forEach((scenario) => {
      switch (item.name) {
        case 'Principal & Interest':
          item[scenario.name] = scenario.results.principalAndInterest;
          break;
        case 'Property Tax':
          item[scenario.name] = scenario.results.propertyTax;
          break;
        case 'Insurance':
          item[scenario.name] = scenario.results.homeInsurance;
          break;
        case 'HOA Fees':
          item[scenario.name] = scenario.results.hoaFees;
          break;
        case 'PMI':
          item[scenario.name] = scenario.results.pmi;
          break;
      }
    });
  });

  // Generate random colors for the bars
  const COLORS = ['#D32F2F', '#FF9800', '#2196F3'];

  return (
    <Card className="w-full bg-white shadow-lg mt-6 sm:mt-8">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-lg sm:text-xl">Saved Scenarios</CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        {/* Scenario List with Edit/Delete Actions */}
        <div className="mb-4 sm:mb-6 space-y-2">
          {scenarios.map((scenario) => {
            const isBeingEdited = editingScenarioId === scenario.id;
            return (
              <div key={scenario.id} className={`flex items-start sm:items-center justify-between p-3 rounded-lg gap-3 ${isBeingEdited ? 'bg-primary/10 border-2 border-primary/30' : 'bg-muted'}`}>
              {editingId === scenario.id ?
                <div className="flex-1 min-w-0 space-y-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Scenario name"
                    className="text-sm" />

                  <Textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Special notes (optional)"
                    className="text-sm min-h-[60px]"
                    rows={2} />

                </div> :

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm sm:text-base truncate">{scenario.name}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {formatCurrency(scenario.results.totalMonthlyPayment)}/mo
                  </p>
                  {isBeingEdited &&
                  <p className="text-xs text-primary font-medium mt-1">Currently editing in calculator</p>
                  }
                  {scenario.specialNotes &&
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{scenario.specialNotes}</p>
                  }
                </div>
                }
              <div className="flex flex-wrap gap-1.5 sm:gap-2 shrink-0">
                {isBeingEdited ?
                  <>
                    <Button
                      size="sm"
                      onClick={onUpdateScenario}
                      className="h-9 sm:h-8 px-2 text-xs">

                      Update Scenario
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onSaveAsNew}
                      className="h-9 sm:h-8 px-2 text-xs">

                      Save as New
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onCancelScenarioEdit}
                      className="h-9 sm:h-8 px-2 text-xs">

                      Cancel
                    </Button>
                  </> :

                  <>
                    {editingId === scenario.id ?
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={saveEditing}
                      disabled={!editName.trim()}
                      className="h-9 sm:h-8 px-2 text-xs">

                        Save
                      </Button> :
                    null}
                    {editingId !== scenario.id && onUpdateScenarioDetails &&
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditing(scenario)}
                      className="h-9 sm:h-8 px-2 text-xs">

                        Edit Name
                      </Button>
                    }
                    {editingId !== scenario.id &&
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditScenario(scenario)}
                      className="h-9 sm:h-8 px-2 text-xs">

                        View/Edit Quote
                      </Button>
                    }
                    {editingId !== scenario.id &&
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRemoveScenario(scenario.id)}
                      className="h-9 sm:h-8 px-2 text-xs text-destructive">

                        Delete
                      </Button>
                    }
                  </>
                  }
              </div>
            </div>);

          })}
        </div>

        {scenarios.length < 2 &&
        <p className="text-sm text-muted-foreground mb-4">
            Add at least 2 scenarios to view comparison charts
          </p>
        }

        {scenarios.length >= 2 &&
        <Tabs defaultValue="monthly">
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="monthly" className="text-xs sm:text-sm py-2.5">Monthly Payment</TabsTrigger>
            <TabsTrigger value="breakdown" className="text-xs sm:text-sm py-2.5">Payment Breakdown</TabsTrigger>
          </TabsList>
          
          <TabsContent value="monthly" className="pt-4">
            <div className="h-[250px] sm:h-[300px] -mx-3 sm:mx-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyCostData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>

                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(value) => `$${Math.round(value / 100) * 100}`} tick={{ fontSize: 11 }} width={60} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  {scenarios.map((scenario, index) =>
                  <Bar
                    key={scenario.id}
                    dataKey={scenario.name}
                    fill={COLORS[index % COLORS.length]} />

                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="breakdown" className="pt-4">
            <div className="h-[250px] sm:h-[300px] -mx-3 sm:mx-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={breakdownData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>

                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis tickFormatter={(value) => `$${Math.round(value / 100) * 100}`} tick={{ fontSize: 11 }} width={60} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  {scenarios.map((scenario, index) =>
                  <Bar
                    key={scenario.id}
                    dataKey={scenario.name}
                    fill={COLORS[index % COLORS.length]} />

                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
        }
      </CardContent>
    </Card>);

};

export default ScenarioComparison;