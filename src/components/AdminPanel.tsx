import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { doc, setDoc, collection, onSnapshot, getDocs, addDoc } from 'firebase/firestore';
import { UserProfile, MealMenu } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Plus, Save, Users, UtensilsCrossed, Check, X } from 'lucide-react';

export function AdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [menu, setMenu] = useState<MealMenu>({
    date: format(new Date(), 'yyyy-MM-dd'),
    breakfast: '',
    lunch: '',
    dinner: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => doc.data() as UserProfile));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

    return () => unsub();
  }, []);

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

  const toggleStatus = async (userId: string, field: 'rentPaid' | 'billPaid', currentVal: boolean) => {
    try {
      await setDoc(doc(db, 'users', userId), { [field]: !currentVal }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const addMealForUser = async (userId: string) => {
    const cost = prompt('Enter meal cost:', '50');
    if (!cost) return;

    try {
      await addDoc(collection(db, 'meals'), {
        userId,
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'lunch', // Defaulting to lunch for simplicity in this demo
        cost: parseFloat(cost)
      });
      alert('Meal record added!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'meals');
    }
  };

  const seedData = async () => {
    setLoading(true);
    try {
      // Seed Menu
      const dates = [0, 1, 2].map(i => format(subMonths(new Date(), i), 'yyyy-MM-dd'));
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
      for (let i = 0; i < 20; i++) {
        await addDoc(mealsRef, {
          userId: auth.currentUser?.uid,
          date: format(subMonths(new Date(), Math.floor(i / 5)), 'yyyy-MM-dd'),
          type: ['breakfast', 'lunch', 'dinner'][i % 3],
          cost: 40 + Math.random() * 20
        });
      }
      alert('Seed data added successfully!');
    } catch (error) {
      console.error('Seeding failed', error);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={seedData} disabled={loading}>
          Seed Test Data
        </Button>
      </div>
      {/* Menu Management */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader>
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-slate-400" />
            <CardTitle>Manage Daily Menu</CardTitle>
          </div>
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

      {/* User Management */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-400" />
            <CardTitle>Resident Management</CardTitle>
          </div>
          <CardDescription>Update payment status and record meals.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Room</TableHead>
                <TableHead className="font-semibold">Rent Status</TableHead>
                <TableHead className="font-semibold">Bill Status</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.uid}>
                  <TableCell>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </TableCell>
                  <TableCell>{u.room || 'N/A'}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleStatus(u.uid, 'rentPaid', !!u.rentPaid)}
                      className={u.rentPaid ? 'text-green-600' : 'text-red-600'}
                    >
                      {u.rentPaid ? <Check className="w-4 h-4 mr-1" /> : <X className="w-4 h-4 mr-1" />}
                      {u.rentPaid ? 'Paid' : 'Unpaid'}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleStatus(u.uid, 'billPaid', !!u.billPaid)}
                      className={u.billPaid ? 'text-green-600' : 'text-red-600'}
                    >
                      {u.billPaid ? <Check className="w-4 h-4 mr-1" /> : <X className="w-4 h-4 mr-1" />}
                      {u.billPaid ? 'Paid' : 'Unpaid'}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => addMealForUser(u.uid)}>
                      <Plus className="w-4 h-4 mr-1" /> Meal
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
