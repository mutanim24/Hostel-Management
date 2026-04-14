import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { UserProfile, MealMenu, MealRecord } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Utensils, Calendar, CreditCard, Home, CheckCircle2, XCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export function Dashboard({ user }: { user: UserProfile }) {
  const [menu, setMenu] = useState<MealMenu | null>(null);
  const [monthlyMeals, setMonthlyMeals] = useState<MealRecord[]>([]);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    // Fetch today's menu
    const menuRef = doc(db, 'menu', today);
    const unsubMenu = onSnapshot(menuRef, (doc) => {
      if (doc.exists()) {
        setMenu(doc.data() as MealMenu);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `menu/${today}`));

    // Fetch monthly meals
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    const mealsRef = collection(db, 'meals');
    const q = query(
      mealsRef,
      where('userId', '==', user.uid),
      where('date', '>=', format(start, 'yyyy-MM-dd')),
      where('date', '<=', format(end, 'yyyy-MM-dd'))
    );

    const unsubMeals = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MealRecord));
      setMonthlyMeals(records);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'meals'));

    return () => {
      unsubMenu();
      unsubMeals();
    };
  }, [user.uid, today]);

  const totalCost = monthlyMeals.reduce((acc, meal) => acc + meal.cost, 0);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Today's Food */}
      <Card className="lg:col-span-2 border-none shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold">Today's Menu</CardTitle>
            <CardDescription>{format(new Date(), 'EEEE, MMMM do')}</CardDescription>
          </div>
          <Utensils className="h-5 w-5 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-1">Breakfast</p>
              <p className="text-slate-900 font-medium">{menu?.breakfast || 'Not set'}</p>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Lunch</p>
              <p className="text-slate-900 font-medium">{menu?.lunch || 'Not set'}</p>
            </div>
            <div className="p-4 rounded-xl bg-green-50 border border-green-100">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Dinner</p>
              <p className="text-slate-900 font-medium">{menu?.dinner || 'Not set'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Summary */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">This Month</CardTitle>
          <Calendar className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900">{monthlyMeals.length}</div>
          <p className="text-xs text-slate-500 mt-1">Total meals recorded</p>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="text-2xl font-bold text-slate-900">₹{totalCost.toFixed(2)}</div>
            <p className="text-xs text-slate-500 mt-1">Estimated meal cost</p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Status */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Payment Status</CardTitle>
          <CreditCard className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
            <div className="flex items-center gap-3">
              <Home className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Room Rent</span>
            </div>
            {user.rentPaid ? (
              <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Paid
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100 border-none">
                <XCircle className="w-3 h-3 mr-1" /> Unpaid
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Current Bill</span>
            </div>
            {user.billPaid ? (
              <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Paid
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100 border-none">
                <XCircle className="w-3 h-3 mr-1" /> Unpaid
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
