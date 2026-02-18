import { Plus, UserPlus, Users, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Accountant() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">Accountant</h1>
          <p className="text-muted-foreground">Invite and collaborate with your accountant or CA.</p>
        </div>
        <Button className="gap-2 shadow-lg shadow-primary/20">
          <UserPlus className="h-4 w-4" /> Invite Accountant
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Collaborate with Your Accountant
            </CardTitle>
            <CardDescription>
              Give your accountant secure access to review your books, generate reports, and file returns.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Secure Access</p>
                <p className="text-sm text-muted-foreground">Your accountant gets read-only access with optional permissions for adjustments.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Easy Invitation</p>
                <p className="text-sm text-muted-foreground">Send an email invite and your accountant can access your books instantly.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <UserPlus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No accountant invited</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Invite your chartered accountant or tax professional to collaborate on your books.
            </p>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" /> Invite Your Accountant
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
