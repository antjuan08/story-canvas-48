import {
  BookOpen,
  Users,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/dashboard/KPICard";
import { StoryCard } from "@/components/dashboard/StoryCard";

const kpiData = [
  {
    title: "Total Stories",
    value: "24",
    change: 12,
    changeLabel: "vs last month",
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    title: "Total Views",
    value: "12.4k",
    change: 8,
    changeLabel: "vs last month",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Engagement",
    value: "89%",
    change: 15,
    changeLabel: "vs last month",
    icon: <TrendingUp className="h-5 w-5" />,
  },
  {
    title: "Avg. Read Time",
    value: "4.2m",
    change: -5,
    changeLabel: "vs last month",
    icon: <Clock className="h-5 w-5" />,
  },
];

const recentStories = [
  {
    title: "The Future of Storytelling",
    description: "Exploring how AI and technology are reshaping the way we tell and experience stories in the digital age.",
    status: "published" as const,
    views: 1240,
    lastEdited: "2 hours ago",
  },
  {
    title: "Q4 Business Review",
    description: "A comprehensive overview of our quarterly performance, key achievements, and strategic initiatives.",
    status: "draft" as const,
    views: 89,
    lastEdited: "1 day ago",
  },
  {
    title: "Product Launch Keynote",
    description: "Introducing our revolutionary new features and the vision behind our latest product innovations.",
    status: "published" as const,
    views: 3420,
    lastEdited: "3 days ago",
  },
  {
    title: "Team Building Workshop",
    description: "Interactive session focused on collaboration, communication, and building stronger team dynamics.",
    status: "archived" as const,
    views: 567,
    lastEdited: "1 week ago",
  },
];

export function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening with your stories.
          </p>
        </div>
        
        <Button className="rounded-2xl gap-2 bg-gradient-primary hover:opacity-90 transition-apple">
          <Plus className="h-4 w-4" />
          Create Story
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard
            key={index}
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
            changeLabel={kpi.changeLabel}
            icon={kpi.icon}
          />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Stories */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Stories</h2>
            <Button variant="ghost" className="gap-2 text-primary">
              View all
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid gap-6">
            {recentStories.map((story, index) => (
              <StoryCard key={index} {...story} />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
            
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 h-12 rounded-2xl"
              >
                <Plus className="h-4 w-4" />
                New Story
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 h-12 rounded-2xl"
              >
                <Plus className="h-4 w-4" />
                New Keynote
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 h-12 rounded-2xl"
              >
                <TrendingUp className="h-4 w-4" />
                View Analytics
              </Button>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">Recent Activity</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
                <div className="text-sm">
                  <p className="font-medium">Story published</p>
                  <p className="text-muted-foreground">
                    "The Future of Storytelling" went live
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                <div className="text-sm">
                  <p className="font-medium">New collaboration</p>
                  <p className="text-muted-foreground">
                    Sarah invited you to "Q4 Review"
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">1 day ago</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-purple-500 mt-2" />
                <div className="text-sm">
                  <p className="font-medium">Analytics milestone</p>
                  <p className="text-muted-foreground">
                    Reached 10k total views
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">3 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}