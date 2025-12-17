import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Filter } from "lucide-react";

interface JobFiltersProps {
  filters: {
    type: string;
    category: string;
    level: string;
  };
  onFilterChange: (filters: any) => void;
}

// Mapping dari database value ke display value
const employmentTypeOptions = [
  { value: "all", label: "Semua Tipe" },
  { value: "fulltime", label: "Full Time" },
  { value: "parttime", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];

const categoryOptions = [
  { value: "all", label: "Semua Kategori" },
  { value: "Technology", label: "Technology" },
  { value: "Design", label: "Design" },
  { value: "Marketing", label: "Marketing" },
  { value: "Business", label: "Business" },
  { value: "Finance", label: "Finance" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Education", label: "Education" },
  { value: "Other", label: "Other" },
];

const levelOptions = [
  { value: "all", label: "Semua Level" },
  { value: "Entry Level", label: "Entry Level" },
  { value: "Mid Level", label: "Mid Level" },
  { value: "Senior Level", label: "Senior Level" },
  { value: "Executive", label: "Executive" },
];

export function JobFilters({ filters, onFilterChange }: JobFiltersProps) {
  const handleFilterChange = (key: string, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <Card className="p-4 sm:p-6 border-0 bg-gradient-to-br from-white to-purple-50/30 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="p-1.5 sm:p-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg shadow-md">
          <Filter className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
        </div>
        <h3 className="text-gray-900 font-semibold text-base sm:text-lg">Filter Pencarian</h3>
      </div>

      {/* Job Type */}
      <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-200/40">
        <Label className="mb-2 sm:mb-3 block text-gray-700 font-medium text-xs sm:text-sm">Tipe Pekerjaan</Label>
        <Select
          value={filters.type}
          onValueChange={(value) => handleFilterChange("type", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih tipe pekerjaan" />
          </SelectTrigger>
          <SelectContent className="!bg-white text-gray-900 border border-gray-200">
            {employmentTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-gray-900 hover:bg-gray-100" >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category */}
      <div className="mb-6 pb-6 border-b border-gray-200/40">
        <Label className="mb-3 block text-gray-700 font-medium" style={{ fontSize: '14px' }}>Kategori</Label>
        <Select
          value={filters.category}
          onValueChange={(value) => handleFilterChange("category", value)}
        >
          <SelectTrigger className="w-full ">
            <SelectValue placeholder="Pilih kategori" />
          </SelectTrigger>
          <SelectContent className="!bg-white text-gray-900 border border-gray-200">
            {categoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-gray-900 hover:bg-gray-100" >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Level */}
      <div>
        <Label className="mb-3 block text-gray-700 font-medium" style={{ fontSize: '14px' }}>Level</Label>
        <Select
          value={filters.level}
          onValueChange={(value) => handleFilterChange("level", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih level" />
          </SelectTrigger>
          <SelectContent className="!bg-white text-gray-900 border border-gray-200">
            {levelOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-gray-900 hover:bg-gray-100" >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}