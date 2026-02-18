
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOrganization } from "@/context/OrganizationContext";
import { useBranding } from "@/hooks/use-branding";
import { useAuthStore } from "@/store/authStore";
import {
  ChevronsUpDown,
  Check,
  PlusCircle,
  LayoutDashboard,
  ShoppingCart,
  Users,
  FileText,
  Settings as SettingsIcon,
  Menu,
  ChevronRight,
  Package,
  ShoppingBag,
  Clock,
  Building2,
  FileCheck,
  UserCog,
  BarChart3,
  FolderOpen,
  Home,
  PanelLeftClose,
  LogOut
} from "lucide-react";

interface NavItemProps {
  href: string;
  icon?: React.ElementType;
  label: string;
  indent?: boolean;
  onClick?: () => void;
}

const NavItem = ({ href, icon: Icon, label, indent, onClick }: NavItemProps) => {
  const [location] = useLocation();
  const isActive = location === href;

  return (
    <Link href={href}>
      <div
        onClick={onClick}
        className={cn(
          "group relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200 cursor-pointer font-display",
          isActive
            ? "bg-sidebar-accent text-sidebar-foreground font-semibold shadow-sm"
            : "text-sidebar-foreground/75 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground font-medium",
          indent && "pl-11"
        )}
      >
        {isActive && (
          <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-sidebar-primary rounded-r-full" />
        )}
        {Icon && (
          <Icon
            className={cn(
              "h-4 w-4 transition-colors",
              isActive ? "text-sidebar-foreground" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
            )}
          />
        )}
        <span>{label}</span>
      </div>
    </Link>
  );
};

interface CollapsibleNavItemProps {
  id: string;
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  openMenu: string | null;
  onMenuChange: (id: string | null) => void;
}

const CollapsibleNavItem = ({ id, icon: Icon, label, children, openMenu, onMenuChange }: CollapsibleNavItemProps) => {
  const [location] = useLocation();
  const isOpen = openMenu === id;

  // Check if any child item is active to highlight the parent
  const hasActiveChild = (children as any)?.props?.children?.some((child: any) => {
    if (child && child.props && child.props.href) {
      return location === child.props.href;
    }
    return false;
  }) || false;

  return (
    <Collapsible open={isOpen} onOpenChange={(open) => {
      onMenuChange(open ? id : null);
    }} className="space-y-0.5">
      <CollapsibleTrigger asChild>
        <div
          className={cn(
            "group flex items-center justify-between px-3 py-2.5 rounded-md text-sm transition-all duration-200 cursor-pointer font-display",
            hasActiveChild
              ? "text-sidebar-foreground font-semibold bg-sidebar-accent/20"
              : "text-sidebar-foreground/75 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground font-medium"
          )}
        >
          <div className="flex items-center gap-3">
            <Icon className={cn(
              "h-4 w-4 transition-colors",
              hasActiveChild ? "text-sidebar-foreground" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
            )} />
            {label}
          </div>
          <ChevronRight
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              hasActiveChild ? "text-sidebar-foreground/60" : "text-sidebar-foreground/30 group-hover:text-sidebar-foreground/50",
              isOpen && "rotate-90"
            )}
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0.5 mt-0.5">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const { organizations, currentOrganization, setCurrentOrganization } = useOrganization();
  const { data: branding } = useBranding();
  const { user, logout } = useAuthStore();
  const isCustomer = user?.role === 'customer';

  // ... NavItem definitions

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border/50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between h-14 px-3 border-sidebar-border/50 bg-sidebar/50 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground border-sidebar-border">
              <div className="flex items-center gap-3 text-left">
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center overflow-hidden shadow-sm transition-all duration-200",
                  branding?.icon?.url
                    ? "bg-white p-1"
                    : "bg-sidebar-primary ring-2 ring-sidebar-primary/20"
                )}>
                  {branding?.icon?.url ? (
                    <img
                      src={branding.icon.url}
                      alt={currentOrganization?.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="font-display font-bold text-sidebar-primary-foreground text-lg">
                      {currentOrganization?.name.charAt(0).toUpperCase() || "B"}
                    </span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm leading-tight truncate w-[120px]">
                    {currentOrganization?.name || "Billing App"}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60 font-semibold">
                    {currentOrganization?.industry || "Accounting"}
                  </span>
                </div>
              </div>
              <ChevronsUpDown className="h-4 w-4 text-sidebar-foreground/60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60" align="start">
            <DropdownMenuLabel>My Organizations</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onSelect={() => setCurrentOrganization(org.id)}
                className="flex items-center justify-between cursor-pointer"
              >
                <span className="truncate">{org.name}</span>
                {currentOrganization?.id === org.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setLocation("/settings/organizations")} className="cursor-pointer">
              <PlusCircle className="mr-2 h-4 w-4" />
              Manage Organizations
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ScrollArea className="flex-1 py-3">
        <div className="px-2 space-y-0.5">
          {isCustomer ? (
            <>
              <NavItem href="/customer-dashboard" icon={Home} label="Dashboard" />
              <NavItem href="/customer/profile" icon={UserCog} label="My Profile" />
              <NavItem href="/customer/request" icon={ShoppingCart} label="Request Items" />
              <NavItem href="/customer/quotes" icon={FileText} label="My Quotes" />
              <NavItem href="/customer/invoices" icon={FileText} label="My Invoices" />
              <NavItem href="/customer/receipts" icon={FileCheck} label="My Receipts" />
            </>
          ) : (
            <>
              <NavItem href="/" icon={Home} label="Home" />

              <CollapsibleNavItem id="items" icon={Package} label="Items" openMenu={openMenu} onMenuChange={setOpenMenu}>
                <NavItem href="/items" label="Items" indent />
                <NavItem href="/item-requests" label="Item Requests" indent />
              </CollapsibleNavItem>

              <CollapsibleNavItem id="sales" icon={ShoppingCart} label="Sales" openMenu={openMenu} onMenuChange={setOpenMenu}>
                <NavItem href="/customers" label="Customers" indent />
                <NavItem href="/estimates" label="Quotes" indent />
                <NavItem href="/sales-orders" label="Sales Orders" indent />
                <NavItem href="/invoices" label="Invoices" indent />
                <NavItem href="/delivery-challans" label="Delivery Challans" indent />
                <NavItem href="/payments-received" label="Payments Received" indent />
                <NavItem href="/credit-notes" label="Credit Notes" indent />
                <NavItem href="/eway-bills" label="e-Way Bills" indent />
              </CollapsibleNavItem>

              <CollapsibleNavItem id="purchases" icon={ShoppingBag} label="Purchases" openMenu={openMenu} onMenuChange={setOpenMenu}>
                <NavItem href="/vendors" label="Vendors" indent />
                <NavItem href="/expenses" label="Expenses" indent />
                <NavItem href="/purchase-orders" label="Purchase Orders" indent />
                <NavItem href="/bills" label="Bills" indent />
                <NavItem href="/payments-made" label="Payments Made" indent />
                <NavItem href="/vendor-credits" label="Vendor Credits" indent />
              </CollapsibleNavItem>

              <NavItem href="/banking" icon={Building2} label="Banking (TBD)" />
              <NavItem href="/reports" icon={BarChart3} label="Reports" />
            </>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-sidebar-border bg-sidebar-accent/30">
        <div className="flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-all cursor-pointer border border-transparent hover:border-sidebar-border flex-1"
                data-testid="button-settings"
              >
                <Avatar className="h-8 w-8 border border-sidebar-border/50">
                  <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`} />
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-sidebar-foreground/70 truncate">{user?.email || 'user@example.com'}</p>
                </div>
                <SettingsIcon className="h-4 w-4 text-sidebar-foreground/60" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start" side="top">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation(isCustomer ? "/customer/settings/profile" : "/settings")}>
                <UserCog className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 flex font-sans text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 fixed inset-y-0 z-50 bg-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <main className="flex-1 md:ml-64 h-screen flex flex-col transition-all duration-300 ease-in-out">
        {/* Mobile Menu Toggle */}
        <div className="md:hidden sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(true)} className="-ml-2">
            <Menu className="h-5 w-5 text-slate-600" />
          </Button>
        </div>

        <div className={cn("flex-1 min-h-0 overflow-y-auto scrollbar-hide", (location.includes("/products/new") || location.includes("/vendors/new") || location.includes("/vendors/") && location.includes("/edit") || (location.includes("/eway-bills") && !location.includes("/eway-bills/")) || location.includes("/purchase-orders/new") || (location.includes("/purchase-orders/") && location.includes("/edit")) || location.includes("/bills/new") || (location.includes("/bills/") && location.includes("/edit")) || location.includes("/payments-made/new") || (location.includes("/payments-made/") && location.includes("/edit")) || location.includes("/vendor-credits/new") || (location.includes("/vendor-credits/") && location.includes("/edit"))) ? "p-0" : "p-1 lg:p-2")}>
          {children}
        </div>
      </main>
    </div>
  );
}
