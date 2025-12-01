import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Filter, Sparkles } from "lucide-react";

interface JobFiltersProps {
  filters: {
    type: string;
    category: string;
    level: string;
  };
  onFilterChange: (filters: any) => void;
}

export function JobFilters({ filters, onFilterChange }: JobFiltersProps) {
  const handleFilterChange = (key: string, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <Card className="p-6 sticky top-24 border border-gray-200/60 bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
          <Filter className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-gray-900">Filter Pencarian</h3>
      </div>

      {/* Job Type */}
      <div className="mb-6 pb-6 border-b border-gray-100">
        <Label className="mb-3 block text-gray-700" style={{ fontSize: '14px' }}>Tipe Pekerjaan</Label>
        <RadioGroup
          value={filters.type}
          onValueChange={(value) => handleFilterChange("type", value)}
        >
          <div className="flex items-center space-x-2 mb-2 p-2 rounded-lg hover:bg-gray-50 transition">
            <RadioGroupItem value="all" id="type-all" className="border-gray-300" />
            <Label htmlFor="type-all" className="cursor-pointer flex-1" style={{ fontSize: '14px' }}>
              Semua
            </Label>
          </div>
          <div className="flex items-center space-x-2 mb-2 p-2 rounded-lg hover:bg-gray-50 transition">
            <RadioGroupItem value="Full-time" id="type-fulltime" className="border-gray-300" />
            <Label htmlFor="type-fulltime" className="cursor-pointer flex-1" style={{ fontSize: '14px' }}>
              Full-time
            </Label>
          </div>
          <div className="flex items-center space-x-2 mb-2 p-2 rounded-lg hover:bg-gray-50 transition">
            <RadioGroupItem value="Part-time" id="type-parttime" className="border-gray-300" />
            <Label htmlFor="type-parttime" className="cursor-pointer flex-1" style={{ fontSize: '14px' }}>
              Part-time
            </Label>
          </div>
          <div className="flex items-center space-x-2 mb-2 p-2 rounded-lg hover:bg-gray-50 transition">
            <RadioGroupItem value="Remote" id="type-remote" className="border-gray-300" />
            <Label htmlFor="type-remote" className="cursor-pointer flex-1" style={{ fontSize: '14px' }}>
              Remote
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition">
            <RadioGroupItem value="Freelance" id="type-freelance" className="border-gray-300" />
            <Label htmlFor="type-freelance" className="cursor-pointer flex-1" style={{ fontSize: '14px' }}>
              Freelance
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Category */}
      <div className="mb-6 pb-6 border-b border-gray-100">
        <Label className="mb-3 block text-gray-700" style={{ fontSize: '14px' }}>Kategori</Label>
        <RadioGroup
          value={filters.category}
          onValueChange={(value) => handleFilterChange("category", value)}
        >
          <div className="flex items-center space-x-2 mb-2 p-2 rounded-lg hover:bg-gray-50 transition">
            <RadioGroupItem value="all" id="cat-all" className="border-gray-300" />
            <Label htmlFor="cat-all" className="cursor-pointer flex-1" style={{ fontSize: '14px' }}>
              Semua
            </Label>
          </div>
          <div className="flex items-center space-x-2 mb-2 p-2 rounded-lg hover:bg-gray-50 transition">
            <RadioGroupItem value="Technology" id="cat-tech" className="border-gray-300" />
            <Label htmlFor="cat-tech" className="cursor-pointer flex-1" style={{ fontSize: '14px' }}>
              Technology
            </Label>
          </div>
          <div className="flex items-center space-x-2 mb-2 p-2 rounded-lg hover:bg-gray-50 transition">
            <RadioGroupItem value="Design" id="cat-design" className="border-gray-300" />
            <Label htmlFor="cat-design" className="cursor-pointer flex-1" style={{ fontSize: '14px' }}>
              Design
            </Label>
          </div>
          <div className="flex items-center space-x-2 mb-2 p-2 rounded-lg hover:bg-gray-50 transition">
            <RadioGroupItem value="Marketing" id="cat-marketing" className="border-gray-300" />
            <Label htmlFor="cat-marketing" className="cursor-pointer flex-1" style={{ fontSize: '14px' }}>
              Marketing
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition">
            <RadioGroupItem value="Business" id="cat-business" className="border-gray-300" />
            <Label htmlFor="cat-business" className="cursor-pointer flex-1" style={{ fontSize: '14px' }}>
              Business
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Level */}
      <div>
        <Label className="mb-3 block text-gray-700" style={{ fontSize: '14px' }}>Level</Label>
        <RadioGroup
          value={filters.level}
          onValueChange={(value) => handleFilterChange("level", value)}
        >
          <div className="flex items-center space-x-2 mb-2 p-2 rounded-lg hover:bg-gray-50 transition">
            <RadioGroupItem value="all" id="level-all" className="border-gray-300" />
            <Label htmlFor="level-all" className="cursor-pointer flex-1" style={{ fontSize: '14px' }}>
              Semua
            </Label>
          </div>
          <div className="flex items-center space-x-2 mb-2 p-2 rounded-lg hover:bg-gray-50 transition">
            <RadioGroupItem value="Entry Level" id="level-entry" className="border-gray-300" />
            <Label htmlFor="level-entry" className="cursor-pointer flex-1" style={{ fontSize: '14px' }}>
              Entry Level
            </Label>
          </div>
          <div className="flex items-center space-x-2 mb-2 p-2 rounded-lg hover:bg-gray-50 transition">
            <RadioGroupItem value="Mid Level" id="level-mid" className="border-gray-300" />
            <Label htmlFor="level-mid" className="cursor-pointer flex-1" style={{ fontSize: '14px' }}>
              Mid Level
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition">
            <RadioGroupItem value="Senior Level" id="level-senior" className="border-gray-300" />
            <Label htmlFor="level-senior" className="cursor-pointer flex-1" style={{ fontSize: '14px' }}>
              Senior Level
            </Label>
          </div>
        </RadioGroup>
      </div>
    </Card>
  );
}