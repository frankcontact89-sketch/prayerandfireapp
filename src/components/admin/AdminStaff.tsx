import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { UserPlus, Trash2, Shield } from "lucide-react";

interface AdminStaffProps {
  t: (key: string) => string;
}

interface StaffMember {
  id: string;
  user_id: string;
  role: string;
  profile?: {
    username: string;
    email: string;
  };
}

export function AdminStaff({ t }: AdminStaffProps) {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStaffMembers();
  }, []);

  const fetchStaffMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          id,
          user_id,
          role,
          profiles:user_id (username, email)
        `)
        .eq("role", "admin");

      if (error) throw error;

      // Transform the data to flatten the profile
      const transformedData = data?.map(item => ({
        ...item,
        profile: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
      })) || [];

      setStaffMembers(transformedData);
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast({
        title: "Error",
        description: "Failed to load staff members",
        variant: "destructive",
      });
    }
  };

  const addStaffMember = async () => {
    if (!newStaffEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // First, find the user by email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", newStaffEmail.trim())
        .single();

      if (profileError || !profile) {
        toast({
          title: "Error",
          description: "User not found with that email",
          variant: "destructive",
        });
        return;
      }

      // Add admin role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: profile.id, role: "admin" });

      if (roleError) {
        if (roleError.code === "23505") {
          toast({
            title: "Error",
            description: "User is already an admin",
            variant: "destructive",
          });
        } else {
          throw roleError;
        }
      } else {
        toast({
          title: "Success",
          description: "Admin added successfully",
        });
        setNewStaffEmail("");
        fetchStaffMembers();
      }
    } catch (error) {
      console.error("Error adding staff:", error);
      toast({
        title: "Error",
        description: "Failed to add admin",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeStaffMember = async (roleId: string, username: string) => {
    if (!confirm(`Remove ${username} as admin?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Admin removed successfully",
      });
      fetchStaffMembers();
    } catch (error) {
      console.error("Error removing staff:", error);
      toast({
        title: "Error",
        description: "Failed to remove admin",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-bold text-foreground">
            Add Admin Staff
          </h3>
        </div>
        
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter user email"
            value={newStaffEmail}
            onChange={(e) => setNewStaffEmail(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addStaffMember()}
            className="flex-1"
          />
          <Button onClick={addStaffMember} disabled={loading}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-bold text-foreground mb-4">
          Current Admin Staff
        </h3>
        
        <div className="space-y-3">
          {staffMembers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No admin staff members yet
            </p>
          ) : (
            staffMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 bg-secondary rounded-lg"
              >
                <div>
                  <p className="font-semibold text-foreground">
                    {member.profile?.username || "Unknown User"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {member.profile?.email}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeStaffMember(member.id, member.profile?.username || "user")}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
