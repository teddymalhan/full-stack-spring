import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bug, PlayCircle, Database, Zap } from "lucide-react";

interface DebugModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DebugModal({ open, onOpenChange }: DebugModalProps) {
  const handleTestFlow = (flowName: string) => {
    console.log(`Testing ${flowName} flow...`);
    // TODO: Add your custom E2E testing logic here
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-amber-500" />
            Debug & E2E Testing
          </DialogTitle>
          <DialogDescription>
            Test end-to-end flows and debug your application
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="flows" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="flows">Test Flows</TabsTrigger>
            <TabsTrigger value="api">API Testing</TabsTrigger>
            <TabsTrigger value="data">Data Utils</TabsTrigger>
          </TabsList>

          {/* Test Flows Tab */}
          <TabsContent value="flows" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">User Flows</CardTitle>
                <CardDescription>Test common user journeys</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleTestFlow("User Sign-up")}
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Test User Sign-up Flow
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleTestFlow("Channel Selection")}
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Test Channel Selection Flow
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleTestFlow("Video Playback")}
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Test Video Playback Flow
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Authentication</CardTitle>
                <CardDescription>Test auth scenarios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleTestFlow("Login")}
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Test Login Flow
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleTestFlow("Logout")}
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Test Logout Flow
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Testing Tab */}
          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">API Endpoints</CardTitle>
                <CardDescription>Test backend API calls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleTestFlow("Protected API")}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Test Protected API Endpoint
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleTestFlow("Public API")}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Test Public API Endpoint
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleTestFlow("Supabase Query")}
                >
                  <Database className="w-4 h-4 mr-2" />
                  Test Supabase Query
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Utils Tab */}
          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Management</CardTitle>
                <CardDescription>Manage test data and state</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    console.log("Clearing localStorage...");
                    localStorage.clear();
                    console.log("localStorage cleared");
                  }}
                >
                  <Database className="w-4 h-4 mr-2" />
                  Clear Local Storage
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    console.log("Current localStorage:", { ...localStorage });
                  }}
                >
                  <Database className="w-4 h-4 mr-2" />
                  Dump Local Storage
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleTestFlow("Seed Test Data")}
                >
                  <Database className="w-4 h-4 mr-2" />
                  Seed Test Data
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="bg-muted/50 rounded-lg p-4 mt-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> This is a placeholder debug panel. Add your custom E2E testing
            tooling in the button handlers above. Check the console for test execution logs.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
