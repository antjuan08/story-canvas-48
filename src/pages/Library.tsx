import { Search, Filter, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StoryCard } from "@/components/dashboard/StoryCard";

const stories = [
  {
    title: "The Art of Digital Storytelling",
    description: "Master the craft of creating compelling narratives in the digital space with practical tips and techniques.",
    status: "published" as const,
    views: 2340,
    lastEdited: "2 days ago",
  },
  {
    title: "Data-Driven Presentations",
    description: "Transform complex data into engaging visual stories that resonate with your audience.",
    status: "draft" as const,
    views: 156,
    lastEdited: "5 hours ago",
  },
  {
    title: "Leadership Through Stories",
    description: "How effective leaders use storytelling to inspire, motivate, and drive organizational change.",
    status: "published" as const,
    views: 1789,
    lastEdited: "1 week ago",
  },
  {
    title: "Customer Success Stories",
    description: "Real stories from customers showcasing transformative results and business impact.",
    status: "published" as const,
    views: 987,
    lastEdited: "3 days ago",
  },
  {
    title: "Innovation Workshop Recap",
    description: "Key insights and breakthroughs from our latest innovation workshop series.",
    status: "archived" as const,
    views: 543,
    lastEdited: "2 weeks ago",
  },
  {
    title: "Quarterly Team Updates",
    description: "Comprehensive updates on team achievements, challenges, and upcoming initiatives.",
    status: "draft" as const,
    views: 234,
    lastEdited: "1 day ago",
  },
];

export function Library() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Library</h1>
        <p className="text-muted-foreground mt-1">
          Browse and manage all your stories and presentations.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search your library..."
            className="pl-10 rounded-2xl"
          />
        </div>
        
        <Button variant="outline" className="gap-2 rounded-2xl">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
        
        <div className="flex items-center gap-1 border rounded-2xl p-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Grid className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stories.map((story, index) => (
          <StoryCard key={index} {...story} />
        ))}
      </div>
    </div>
  );
}