import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { UserPlus, Trash2, Shield } from "lucide-react";

interface AdminStaffProps {
  t: (en: string, es: string) => string;
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
        title: t("Error", "Error"),
        description: t("Failed to load staff members", "Error al cargar el personal"),
        variant: "destructive",
      });
    }
  };

  const addStaffMember = async () => {
    if (!newStaffEmail.trim()) {
      toast({
        title: t("Error", "Error"),
        description: t("Please enter an email", "Por favor ingrese un correo"),
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
          title: t("Error", "Error"),
          description: t("User not found with that email", "Usuario no encontrado con ese correo"),
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
            title: t("Error", "Error"),
            description: t("User is already an admin", "El usuario ya es administrador"),
            variant: "destructive",
          });
        } else {
          throw roleError;
        }
      } else {
        toast({
          title: t("Success", "Éxito"),
          description: t("Admin added successfully", "Administrador agregado exitosamente"),
        });
        setNewStaffEmail("");
        fetchStaffMembers();
      }
    } catch (error) {
      console.error("Error adding staff:", error);
      toast({
        title: t("Error", "Error"),
        description: t("Failed to add admin", "Error al agregar administrador"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeStaffMember = async (roleId: string, username: string) => {
    if (!confirm(t(`Remove ${username} as admin?`, `¿Remover a ${username} como administrador?`))) {
      return;
    }

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;

      toast({
        title: t("Success", "Éxito"),
        description: t("Admin removed successfully", "Administrador removido exitosamente"),
      });
      fetchStaffMembers();
    } catch (error) {
      console.error("Error removing staff:", error);
      toast({
        title: t("Error", "Error"),
        description: t("Failed to remove admin", "Error al remover administrador"),
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
            {t("Add Admin Staff", "Agregar Personal Administrativo")}
          </h3>
        </div>
        
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder={t("Enter user email", "Ingrese correo del usuario")}
            value={newStaffEmail}
            onChange={(e) => setNewStaffEmail(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addStaffMember()}
            className="flex-1"
          />
          <Button onClick={addStaffMember} disabled={loading}>
            <UserPlus className="w-4 h-4 mr-2" />
            {t("Add", "Agregar")}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-bold text-foreground mb-4">
          {t("Current Admin Staff", "Personal Administrativo Actual")}
        </h3>
        
        <div className="space-y-3">
          {staffMembers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {t("No admin staff members yet", "Aún no hay personal administrativo")}
            </p>
          ) : (
            staffMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 bg-secondary rounded-lg"
              >
                <div>
                  <p className="font-semibold text-foreground">
                    {member.profile?.username || t("Unknown User", "Usuario Desconocido")}
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
