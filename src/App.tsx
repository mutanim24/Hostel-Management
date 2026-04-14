import { useState } from 'react';
import { Auth } from '@/components/Auth';
import { Dashboard } from '@/components/Dashboard';
import { MealHistory } from '@/components/MealHistory';
import { AdminPanel } from '@/components/AdminPanel';
import { UserProfile } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, History, ShieldAlert, User as UserIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function App() {
  return (
    <Auth>
      {(user) => <MainContent user={user} />}
    </Auth>
  );
}

function MainContent({ user }: { user: UserProfile }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back, {user.name.split(' ')[0]}!</h1>
          <p className="text-slate-500 mt-1">Here's what's happening in your hostel today.</p>
        </div>
        {user.role === 'admin' && (
          <Badge variant="outline" className="w-fit border-slate-200 bg-slate-50 text-slate-600 px-3 py-1">
            <ShieldAlert className="w-3 h-3 mr-1" /> Admin Access
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1 h-12 shadow-sm">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white h-full px-6">
            <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white h-full px-6">
            <History className="w-4 h-4 mr-2" /> Meal History
          </TabsTrigger>
          <TabsTrigger value="profile" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white h-full px-6">
            <UserIcon className="w-4 h-4 mr-2" /> My Profile
          </TabsTrigger>
          {user.role === 'admin' && (
            <TabsTrigger value="admin" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white h-full px-6">
              <ShieldAlert className="w-4 h-4 mr-2" /> Admin Panel
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="dashboard" className="mt-0 focus-visible:outline-none">
          <Dashboard user={user} />
        </TabsContent>

        <TabsContent value="history" className="mt-0 focus-visible:outline-none">
          <MealHistory user={user} />
        </TabsContent>

        <TabsContent value="profile" className="mt-0 focus-visible:outline-none">
          <div className="max-w-2xl">
            <Card className="border-none shadow-sm bg-white">
              <CardHeader>
                <CardTitle>Personal Profile</CardTitle>
                <CardDescription>Your hostel registration details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</p>
                    <p className="text-slate-900 font-medium">{user.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</p>
                    <p className="text-slate-900 font-medium">{user.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Room Number</p>
                    <p className="text-slate-900 font-medium">{user.room || 'Not Assigned'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</p>
                    <Badge variant="secondary" className="capitalize">{user.role}</Badge>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">Account Status</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl border ${user.rentPaid ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                      <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${user.rentPaid ? 'text-green-600' : 'text-red-600'}`}>Room Rent</p>
                      <p className="text-slate-900 font-semibold">{user.rentPaid ? 'Paid for this month' : 'Payment Pending'}</p>
                    </div>
                    <div className={`p-4 rounded-xl border ${user.billPaid ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                      <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${user.billPaid ? 'text-green-600' : 'text-red-600'}`}>Current Bill</p>
                      <p className="text-slate-900 font-semibold">{user.billPaid ? 'Paid for this month' : 'Payment Pending'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {user.role === 'admin' && (
          <TabsContent value="admin" className="mt-0 focus-visible:outline-none">
            <AdminPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
