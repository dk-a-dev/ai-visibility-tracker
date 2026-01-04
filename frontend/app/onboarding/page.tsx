"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../../lib/api";
import { cn } from "../../lib/utils";

const brandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  website: z.string().url("Valid website URL required").optional(),
  description: z.string().optional(),
  is_primary: z.boolean(),
});

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  industry: z.string().optional(),
  company_size: z.string().optional(),
  target_audience: z.string().optional(),
  primary_goals: z.array(z.string()).optional(),
  prompt_distribution: z.string().optional(),
  brands: z.array(brandSchema).min(1, "At least one brand is required"),
});

type ProjectForm = z.infer<typeof projectSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [brands, setBrands] = useState([
    { name: "", website: "", description: "", is_primary: true },
  ]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      brands: [{ name: "", website: "", description: "", is_primary: true }],
    },
  });

  const addBrand = () => {
    const newBrands = [
      ...brands,
      { name: "", website: "", description: "", is_primary: false },
    ];
    setBrands(newBrands);
    setValue("brands", newBrands);
  };

  const removeBrand = (index: number) => {
    if (brands.length > 1) {
      const newBrands = brands.filter((_, i) => i !== index);
      setBrands(newBrands);
      setValue("brands", newBrands);
    }
  };

  const updateBrand = (index: number, field: string, value: any) => {
    const newBrands = [...brands];
    (newBrands[index] as any)[field] = value;
    setBrands(newBrands);
    setValue("brands", newBrands);
  };

  const onSubmit = async (data: ProjectForm) => {
    console.log("Form submitted with data:", data);
    console.log("Brands state:", brands);
    
    setIsLoading(true);
    setError(null);

    try {
      const projectData = {
        ...data,
        brands: brands.map((brand, idx) => ({
          name: brand.name,
          website: brand.website || undefined,
          description: brand.description || undefined,
          is_primary: idx === 0,
        })),
      };
      
      console.log("Sending project data:", projectData);
      const response = await api.post("/projects", projectData);
      console.log("Project created:", response.data);
      router.push(`/dashboard/${response.data.id}`);
    } catch (err: any) {
      console.error("Error creating project:", err);
      setError(
        err.response?.data?.detail ||
          "Failed to create project. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Create Your Project</h1>
          <p className="text-muted-foreground">
            Set up your brand tracking project
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-semibold",
                  step >= 1
                    ? "bg-primary-500 text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                1
              </div>
              <div className="w-16 h-1 bg-muted"></div>
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-semibold",
                  step >= 2
                    ? "bg-primary-500 text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                2
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">
                  Project Information
                </h2>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Project Name *
                  </label>
                  <input
                    {...register("name")}
                    type="text"
                    className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="My AI Visibility Project"
                  />
                  {errors.name && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Category *
                  </label>
                  <select
                    {...register("category")}
                    className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select a category</option>
                    <option value="software">Software</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="saas">SaaS</option>
                    <option value="consulting">Consulting</option>
                    <option value="agency">Agency</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.category && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.category.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    {...register("description")}
                    rows={3}
                    className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Brief description of your project"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Industry
                  </label>
                  <input
                    {...register("industry")}
                    type="text"
                    className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Technology, Finance, Healthcare, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Company Size
                  </label>
                  <select
                    {...register("company_size")}
                    className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select company size</option>
                    <option value="startup">Startup (1-10)</option>
                    <option value="small">Small (11-50)</option>
                    <option value="medium">Medium (51-200)</option>
                    <option value="large">Large (201-1000)</option>
                    <option value="enterprise">Enterprise (1000+)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-md transition-colors"
                >
                  Next
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Add Brands</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your brand and competitors to track
                </p>

                {brands.map((brand, index) => (
                  <div
                    key={index}
                    className="p-4 border border-border rounded-md space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Brand {index + 1} {index === 0 && "(Primary)"}
                      </span>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeBrand(index)}
                          className="text-destructive text-sm hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <input
                      value={brand.name}
                      onChange={(e) => updateBrand(index, "name", e.target.value)}
                      type="text"
                      placeholder="Brand name"
                      required={index === 0}
                      className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />

                    <input
                      value={brand.website}
                      onChange={(e) => updateBrand(index, "website", e.target.value)}
                      type="url"
                      placeholder="Website URL"
                      className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />

                    <textarea
                      value={brand.description}
                      onChange={(e) => updateBrand(index, "description", e.target.value)}
                      rows={2}
                      placeholder="Brief description"
                      className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addBrand}
                  className="w-full py-2 px-4 border border-border hover:bg-accent rounded-md transition-colors"
                >
                  + Add Another Brand
                </button>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-2 px-4 border border-border hover:bg-accent rounded-md transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={cn(
                      "flex-1 py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-md transition-colors",
                      isLoading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isLoading ? "Creating..." : "Create Project"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
