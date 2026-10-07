
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  calculateAmortizationSchedule, 
  formatCurrency 
} from '@/utils/calculatorUtils';
import { AmortizationItem } from '@/types/calculator';

interface AmortizationChartProps {
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
}

interface ChartData {
  year: number;
  principalPaid: number;
  interestPaid: number;
  balance: number;
}

const AmortizationChart: React.FC<AmortizationChartProps> = ({
  loanAmount,
  interestRate,
  loanTerm
}) => {
  const [activeTab, setActiveTab] = useState('chart');
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate the amortization schedule
  const schedule = calculateAmortizationSchedule(loanAmount, interestRate, loanTerm);

  // Process data for the chart (yearly intervals)
  const chartData: ChartData[] = processDataForChart(schedule, loanTerm);

  // Get full detailed schedule (all monthly payments)
  const detailedSchedule = schedule;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="w-full bg-white shadow-lg mt-8">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                Amortization & Payment Schedule
              </CardTitle>
              <ChevronDown 
                className={`h-5 w-5 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </div>
            {!isExpanded && (
              <p className="text-sm text-muted-foreground text-left mt-1">
                Click to view detailed payment breakdown
              </p>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent>
            <Tabs defaultValue="chart" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chart">Chart</TabsTrigger>
                <TabsTrigger value="table">Payment Table</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chart" className="pt-4">
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 30, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="year" 
                        label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
                        tick={{ fontSize: 11 }}
                        height={40}
                        padding={{ left: 20, right: 20 }}
                      />
                      <YAxis 
                        tickFormatter={(value) => `$${Math.round(value / 1000)}k`} 
                        label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft', offset: -15 }}
                        tick={{ fontSize: 11 }}
                        width={60}
                      />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend wrapperStyle={{ paddingTop: 10 }} />
                      <Line 
                        type="monotone" 
                        dataKey="principalPaid" 
                        name="Principal Paid" 
                        stroke="#D32F2F" 
                        strokeWidth={2} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="interestPaid" 
                        name="Interest Paid" 
                        stroke="#2196F3" 
                        strokeWidth={2} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="balance" 
                        name="Remaining Balance" 
                        stroke="#4CAF50" 
                        strokeWidth={2} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              
              <TabsContent value="table" className="pt-4">
                <div className="max-h-[300px] overflow-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Principal
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Interest
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {detailedSchedule.map((item) => (
                        <tr key={item.paymentNumber}>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {item.paymentNumber}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(item.paymentAmount)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(item.principalPayment)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(item.interestPayment)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(item.remainingBalance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

/**
 * Process amortization data into yearly intervals for the chart
 */
function processDataForChart(schedule: AmortizationItem[], loanTerm: number): ChartData[] {
  const chartData: ChartData[] = [];
  const yearsToShow = Math.min(loanTerm, 30); // Show up to 30 years for better visualization
  
  // Initial balance point
  chartData.push({
    year: 0,
    principalPaid: 0,
    interestPaid: 0,
    balance: schedule[0] ? schedule[0].remainingBalance + schedule[0].principalPayment : 0
  });
  
  // Calculate yearly intervals
  for (let year = 1; year <= yearsToShow; year++) {
    const paymentIndex = year * 12 - 1;
    if (paymentIndex < schedule.length) {
      let totalPrincipal = 0;
      let totalInterest = 0;
      
      // Sum up the principal and interest for all payments up to this point
      for (let i = 0; i <= paymentIndex; i++) {
        totalPrincipal += schedule[i].principalPayment;
        totalInterest += schedule[i].interestPayment;
      }
      
      chartData.push({
        year,
        principalPaid: totalPrincipal,
        interestPaid: totalInterest,
        balance: schedule[paymentIndex].remainingBalance
      });
    }
  }
  
  return chartData;
}

/**
 * Get a subset of the schedule for the detailed table view
 */
function getDetailedSchedule(schedule: AmortizationItem[]): AmortizationItem[] {
  // For performance reasons, only show a subset of payments for long schedules
  if (schedule.length > 120) { // More than 10 years
    const result: AmortizationItem[] = [];
    
    // Show first year monthly
    for (let i = 0; i < 12; i++) {
      result.push(schedule[i]);
    }
    
    // Show yearly intervals after that
    for (let i = 24; i < schedule.length; i += 12) {
      result.push(schedule[i - 1]);
    }
    
    // Show the last payment
    if (schedule.length > 0) {
      result.push(schedule[schedule.length - 1]);
    }
    
    return result;
  }
  
  return schedule;
}

export default AmortizationChart;
