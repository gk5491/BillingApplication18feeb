import { useState } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [, setLocation] = useLocation();
    const { login } = useAuthStore();
    const { toast } = useToast();
    const [forgotUsername, setForgotUsername] = useState("");
    const [isForgotLoading, setIsForgotLoading] = useState(false);
    const [isForgotOpen, setIsForgotOpen] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed");
            }

            // Update store
            login(data.data.user, data.data.token);

            toast({
                title: "Login successful",
                description: `Welcome back, ${data.data.user.name || 'User'}!`,
            });

            // Redirect based on role
            if (data.data.user.role === "customer") {
                setLocation("/customer-dashboard");
            } else {
                setLocation("/");
            }

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Card className="w-full max-w-md mx-4">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Sign in</CardTitle>
                    <CardDescription className="text-center">
                        Enter your credentials to access your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email / Username</Label>
                            <Input
                                id="email"
                                type="text"
                                placeholder="admin or customer@test.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Signing in..." : "Sign In"}
                        </Button>
                    </form>
                    <div className="mt-4 text-center">
                        <Dialog open={isForgotOpen} onOpenChange={setIsForgotOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="link"
                                    className="text-sm text-sidebar font-medium"
                                >
                                    Forgot Password?
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Reset Password</DialogTitle>
                                    <DialogDescription>
                                        Enter your username or email address and we'll send you a temporary password.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="forgot-username">Username / Email</Label>
                                        <Input
                                            id="forgot-username"
                                            placeholder="Enter your username or email"
                                            value={forgotUsername}
                                            onChange={(e) => setForgotUsername(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsForgotOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={async () => {
                                            if (!forgotUsername) return;
                                            setIsForgotLoading(true);
                                            try {
                                                const response = await fetch("/api/auth/forgot-password", {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ username: forgotUsername })
                                                });
                                                const data = await response.json();
                                                if (data.success) {
                                                    toast({
                                                        title: "Success",
                                                        description: "Temporary password sent to your email.",
                                                    });
                                                    setIsForgotOpen(false);
                                                } else {
                                                    toast({
                                                        variant: "destructive",
                                                        title: "Error",
                                                        description: data.message || "Failed to reset password",
                                                    });
                                                }
                                            } catch (error: any) {
                                                toast({
                                                    variant: "destructive",
                                                    title: "Error",
                                                    description: error.message,
                                                });
                                            } finally {
                                                setIsForgotLoading(false);
                                            }
                                        }}
                                        disabled={isForgotLoading || !forgotUsername}
                                    >
                                        {isForgotLoading ? "Sending..." : "Send Reset Email"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 text-center text-sm text-slate-600">
                    <div>Default Credentials:</div>
                    <div>Super Admin: superadmin / password</div>
                    <div>Admin: admin / password</div>
                    <div>Customer: customer / password</div>
                </CardFooter>
            </Card>
        </div>
    );
}
