
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, FileText, ShoppingCart, User } from "lucide-react";

export default function CustomerDashboard() {
    const [, setLocation] = useLocation();

    const menuItems = [
        {
            title: "My Profile",
            description: "Manage your contact details and address",
            icon: User,
            href: "/customer/profile",
            color: "text-blue-500",
            bg: "bg-blue-50"
        },
        {
            title: "Request Items",
            description: "Request a new quote for products or services",
            icon: ShoppingCart,
            href: "/customer/request",
            color: "text-green-500",
            bg: "bg-green-50"
        },
        {
            title: "My Quotes",
            description: "View and approve estimates sent to you",
            icon: FileText,
            href: "/customer/quotes",
            color: "text-purple-500",
            bg: "bg-purple-50"
        },
        {
            title: "My Invoices",
            description: "View and pay your invoices",
            icon: Package,
            href: "/customer/invoices",
            color: "text-orange-500",
            bg: "bg-orange-50"
        }
    ];

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-8">Customer Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.map((item) => (
                    <Card key={item.title} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation(item.href)}>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className={`p-3 rounded-lg ${item.bg}`}>
                                <item.icon className={`w-6 h-6 ${item.color}`} />
                            </div>
                            <div>
                                <CardTitle className="text-xl">{item.title}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-500">{item.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
