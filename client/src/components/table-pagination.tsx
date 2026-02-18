import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}
export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: TablePaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  if (totalItems === 0) return null;
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };
  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-slate-200 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky bottom-0 w-full z-[10] shadow-[0_-8px_30px_rgb(0,0,0,0.04)]" data-testid="pagination-container">
      <div className="text-xs sm:text-sm text-slate-500 whitespace-nowrap" data-testid="pagination-info">
        Showing <span className="font-medium text-slate-900 dark:text-white">{startItem}</span> to <span className="font-medium text-slate-900 dark:text-white">{endItem}</span> of <span className="font-medium text-slate-900 dark:text-white">{totalItems}</span>
      </div>
      <div className="flex items-center justify-center gap-1.5 origin-right">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-md border-sidebar-border bg-white dark:bg-sidebar-accent hover:bg-sidebar-primary/10 hover:border-sidebar-primary transition-all duration-200"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          data-testid="pagination-first"
        >
          <ChevronsLeft className="h-4 w-4 text-sidebar-primary" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-md border-sidebar-border bg-white dark:bg-sidebar-accent hover:bg-sidebar-primary/10 hover:border-sidebar-primary transition-all duration-200"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          data-testid="pagination-prev"
        >
          <ChevronLeft className="h-4 w-4 text-sidebar-primary" />
        </Button>

        <div className="flex items-center gap-1.5 px-1">
          {getPageNumbers().map((page, index) => (
            typeof page === "number" ? (
              <Button
                key={index}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className={`h-8 w-8 rounded-md font-medium transition-all duration-200 ${currentPage === page
                  ? "bg-sidebar text-sidebar-foreground shadow-sm border-sidebar hover:bg-sidebar/90"
                  : "border-sidebar-border bg-white dark:bg-sidebar-accent hover:bg-sidebar/10 text-sidebar dark:text-sidebar-foreground"
                  }`}
                onClick={() => onPageChange(page)}
                data-testid={`pagination-page-${page}`}
              >
                {page}
              </Button>
            ) : (
              <span key={index} className="px-1 text-slate-400 select-none">...</span>
            )
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-md border-sidebar-border bg-white dark:bg-sidebar-accent hover:bg-sidebar-primary/10 hover:border-sidebar-primary transition-all duration-200"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          data-testid="pagination-next"
        >
          <ChevronRight className="h-4 w-4 text-sidebar-primary" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-md border-sidebar-border bg-white dark:bg-sidebar-accent hover:bg-sidebar-primary/10 hover:border-sidebar-primary transition-all duration-200"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          data-testid="pagination-last"
        >
          <ChevronsRight className="h-4 w-4 text-sidebar-primary" />
        </Button>
      </div>
    </div>
  );
}