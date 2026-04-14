import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, auth } from '@/firebase';
import { doc, setDoc, collection, onSnapshot, addDoc } from 'firebase/firestore';
import { UserProfile, MealMenu } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, subMonths } from 'date-fns';
import { Save, UtensilsCrossed, LayoutDashboard, Users, Receipt, Database } from 'lucide-react';
import { AdminDashboard } from './admin/AdminDashboard';
import { AdminUserDetail } from './admin/AdminUserDetail';
import { AdminExpenses } from './admin/AdminExpenses';

export function AdminPanel() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [menu, setMenu] = useState<MealMenu>({
    date: format(new Date(), 'yyyy-MM-dd'),
    breakfast: '',
    lunch: '',
    dinner: ''
  });
  const [loading, setLoading] = useState(false);

  const saveMenu = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'menu', menu.date), menu);
      alert('Menu updated successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `menu/${menu.date}`);
    }
    setLoading(false);
  };

  const seedData = async () => {
    setLoading(true);
    try {
      // Seed Menu
      const dates = [0, 1].map(i => format(subMonths(new Date(), i), 'yyyy-MM-dd'));
      for (const d of dates) {
        await setDoc(doc(db, 'menu', d), {
          date: d,
          breakfast: 'Poha & Tea',
          lunch: 'Rice, Dal, Mixed Veg',
          dinner: 'Roti, Paneer, Salad'
        });
      }

      // Seed Meals for current user
      const mealsRef = collection(db, 'meals');
      for (let i = 0; i < 15; i++) {
        await addDoc(mealsRef, {
          userId: auth.currentUser?.uid,
          date: format(new Date(), 'yyyy-MM-dd'),
          type: ['breakfast', 'lunch', 'dinner'][i % 3],
          status: 'ON'
        });
      }

      // Seed Expenses
      const expensesRef = collection(db, 'expenses');
      await addDoc(expensesRef, { title: 'Rice 25kg', amount: 1200, date: format(new Date(), 'yyyy-MM-dd') });
      await addDoc(expensesRef, { title: 'Vegetables', amount: 450, date: format(new Date(), 'yyyy-MM-dd') });
      
      alert('Demo data seeded successfully!');
    } catch (error) {
      console.error('Seeding failed', error);
    }
    setLoading(false);
  };

  if (selectedUserId) {
    return <AdminUserDetail userId={selectedUserId} onBack={() => setSelectedUserId(null)} />;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-white">
            <LayoutDashboard className="w-4 h-4 mr-2" /> Overview
          </TabsTrigger>
          <TabsTrigger value="menu" className="data-[state=active]:bg-white">
            <UtensilsCrossed className="w-4 h-4 mr-2" /> Daily Menu
          </TabsTrigger>
          <TabsTrigger value="expenses" className="data-[state=active]:bg-white">
            <Receipt className="w-4 h-4 mr-2" /> Bazar Costs
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-white">
            <Database className="w-4 h-4 mr-2" /> System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <AdminDashboard onUserClick={setSelectedUserId} />
        </TabsContent>

        <TabsContent value="menu">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle>Manage Daily Menu</CardTitle>
              <CardDescription>Set the food for the day.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Date</label>
                  <Input type="date" value={menu.date} onChange={(e) => setMenu({ ...menu, date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Breakfast</label>
                  <Input value={menu.breakfast} onChange={(e) => setMenu({ ...menu, breakfast: e.target.value })} placeholder="e.g. Poha, Tea" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Lunch</label>
                  <Input value={menu.lunch} onChange={(e) => setMenu({ ...menu, lunch: e.target.value })} placeholder="e.g. Rice, Dal, Veg" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Dinner</label>
                  <Input value={menu.dinner} onChange={(e) => setMenu({ ...menu, dinner: e.target.value })} placeholder="e.g. Roti, Sabzi" />
                </div>
              </div>
              <Button onClick={saveMenu} disabled={loading} className="bg-slate-900 text-white">
                <Save className="w-4 h-4 mr-2" /> Save Menu
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <AdminExpenses />
        </TabsContent>

        <TabsContent value="system">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle>System Tools</CardTitle>
              <CardDescription>Maintenance and testing utilities.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={seedData} disabled={loading}>
                <Database className="w-4 h-4 mr-2" /> Seed Demo Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
