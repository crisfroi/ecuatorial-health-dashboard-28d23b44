import React from 'react';
import { useAuth, useRole } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const AuthDebug: React.FC = () => {
  const { user, userRole, isLoading } = useAuth();
  const { currentRole, isAdmin, restrictions } = useRole();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="mb-4 border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-sm text-yellow-800">🔧 Auth Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <strong>Loading:</strong> 
            <Badge variant={isLoading ? "destructive" : "default"}>
              {isLoading ? "Loading" : "Ready"}
            </Badge>
          </div>
          <div>
            <strong>User Role:</strong> 
            <Badge variant={userRole ? "default" : "destructive"}>
              {userRole || "None"}
            </Badge>
          </div>
          <div>
            <strong>Is Admin:</strong> 
            <Badge variant={isAdmin ? "default" : "secondary"}>
              {isAdmin ? "Yes" : "No"}
            </Badge>
          </div>
          <div>
            <strong>User Email:</strong> 
            <span className="font-mono text-xs">{user?.email || "None"}</span>
          </div>
          <div>
            <strong>User ID:</strong> 
            <span className="font-mono text-xs">{user?.id || "None"}</span>
          </div>
          <div>
            <strong>Full Name:</strong> 
            <span className="text-xs">{user?.full_name || "None"}</span>
          </div>
          <div>
            <strong>Current Role:</strong> 
            <span className="font-mono text-xs">{currentRole || "None"}</span>
          </div>
          <div>
            <strong>Restrictions:</strong> 
            <span className="text-xs">{Object.keys(restrictions).length} active</span>
          </div>
        </div>
        
        {user && (
          <div className="mt-3 p-2 bg-yellow-100 rounded text-xs">
            <strong>Raw User Data:</strong>
            <pre className="mt-1 whitespace-pre-wrap">{JSON.stringify(user, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuthDebug;
