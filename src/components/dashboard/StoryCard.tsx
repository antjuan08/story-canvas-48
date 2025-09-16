import { MoreHorizontal, Eye, Share2, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface StoryCardProps {
  title: string;
  description: string;
  status: "draft" | "published" | "archived";
  views: number;
  lastEdited: string;
  thumbnail?: string;
}

export function StoryCard({
  title,
  description,
  status,
  views,
  lastEdited,
  thumbnail,
}: StoryCardProps) {
  const statusColors = {
    draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    published: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    archived: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
  };

  return (
    <div className="glass-card overflow-hidden hover:shadow-apple-lg transition-apple group">
      {/* Thumbnail */}
      <div className="relative h-40 bg-gradient-primary">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-white/80 font-bold text-4xl">
              {title.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
        
        {/* Status badge */}
        <Badge
          className={`absolute top-3 left-3 capitalize ${statusColors[status]}`}
        >
          {status}
        </Badge>

        {/* Actions */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-apple">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8 rounded-xl">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card">
              <DropdownMenuItem>
                <Edit3 className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{title}</h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {description}
        </p>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {views.toLocaleString()} views
          </div>
          <span>Edited {lastEdited}</span>
        </div>
      </div>
    </div>
  );
}