import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { UserProfile, MealRecord } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

export function MealHistory({ user }: { user: UserProfile }) {
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [period, setPeriod] = useState<'1' | '3' | '6'>('1');

  useEffect(() => {
    const mealsRef = collection(db, 'meals');
    const q = query(mealsRef, where('userId', '==', user.uid));

    const unsub = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MealRecord));
      setMeals(records);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'meals'));

    return () => unsub();
  }, [user.uid]);

  const getMonthlyData = (months: number) => {
    const data: { month: string; cost: number; count: number }[] = [];
    for (let i = 0; i < months; i++) {
      const date = subMonths(new Date(), i);
      const monthStr = format(date, 'MMM yyyy');
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const monthlyMeals = meals.filter(meal => {
        const mealDate = parseISO(meal.date);
        return isWithinInterval(mealDate, { start, end });
      });

      data.unshift({
        month: monthStr,
        cost: monthlyMeals.reduce((acc, m) => acc + m.cost, 0),
        count: monthlyMeals.length
      });
    }
    return data;
  };

  const chartData = getMonthlyData(parseInt(period));

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-6">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold">Cost Analysis</CardTitle>
            <CardDescription>Breakdown of your meal expenses over time.</CardDescription>
          </div>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="w-auto">
            <TabsList className="bg-slate-100 p-1">
              <TabsTrigger value="1" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">1M</TabsTrigger>
              <TabsTrigger value="3" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">3M</TabsTrigger>
              <TabsTrigger value="6" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">6M</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Cost']}
                />
                <Bar dataKey="cost" radius={[4, 4, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#0f172a' : '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            {chartData.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{item.month}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-900">₹{item.cost.toFixed(2)}</span>
                  <span className="text-xs text-slate-400">({item.count} meals)</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
