'use client';

import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Bot, CreditCard, LayoutDashboard, Presentation } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
    {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Q&A',
        url: '/qa',
        icon: Bot,
    },
    {
        title: 'Meetings',
        url: '/meetings',
        icon: Presentation,
    },
    {
        title: 'Billiing',
        url: '/billing',
        icon: CreditCard,
    },
]

const AppSidebar = () => {

    const pathname = usePathname();
  return (
       <Sidebar collapsible="icon" variant="floating">
            <SidebarHeader>
                Logo
            </SidebarHeader>
        
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Applications</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item, index) => (
                                <SidebarMenuItem key={index}>
                                    <SidebarMenuButton asChild>
                                        <Link href={item.url} className={cn(
                                            {
                                                '!bg-primary !text-white': pathname === item.url,
                                            }, 'list-none'   
                                        )}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                            
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
       </Sidebar>
)
}

export default AppSidebar