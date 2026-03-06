import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardIndexPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-[#1D2981]">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>Active Staff</CardTitle></CardHeader><CardContent>18</CardContent></Card>
        <Card><CardHeader><CardTitle>Audit Events Today</CardTitle></CardHeader><CardContent>154</CardContent></Card>
        <Card><CardHeader><CardTitle>Pending Announcements</CardTitle></CardHeader><CardContent>3</CardContent></Card>
      </div>
    </section>
  );
}
