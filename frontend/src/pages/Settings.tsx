import { motion } from "framer-motion";
import { useUser, useClerk } from "@clerk/clerk-react";
import { Navigation } from "@/components/ui/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/components/theme-provider";
import { useSettingsStore, type VideoQuality, type Theme as SettingsTheme } from "@/stores/settings";
import {
  Settings as SettingsIcon,
  User,
  Monitor,
  Volume2,
  Play,
  Sun,
  Moon,
  Laptop,
  LogOut,
  ExternalLink,
} from "lucide-react";

function PreferencesTab() {
  const { theme: appTheme, setTheme: setAppTheme } = useTheme();
  const {
    videoQuality,
    autoplay,
    soundEffects,
    setVideoQuality,
    setAutoplay,
    setSoundEffects,
    setTheme: setStoreTheme,
  } = useSettingsStore();

  const handleThemeChange = (value: string) => {
    const newTheme = value as SettingsTheme;
    setStoreTheme(newTheme);
    setAppTheme(newTheme);
  };

  const handleQualityChange = (value: string) => {
    setVideoQuality(value as VideoQuality);
  };

  return (
    <div className="space-y-6">
      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize how RetroWatch looks on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground">
                Select your preferred theme
              </p>
            </div>
            <Select value={appTheme} onValueChange={handleThemeChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4" />
                    Light
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4" />
                    Dark
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Laptop className="w-4 h-4" />
                    System
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Video Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Playback
          </CardTitle>
          <CardDescription>
            Configure video playback preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Video Quality</Label>
              <p className="text-sm text-muted-foreground">
                Choose your preferred streaming quality
              </p>
            </div>
            <Select value={videoQuality} onValueChange={handleQualityChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (480p)</SelectItem>
                <SelectItem value="medium">Medium (720p)</SelectItem>
                <SelectItem value="high">High (1080p)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoplay">Autoplay</Label>
              <p className="text-sm text-muted-foreground">
                Automatically play videos when a channel is selected
              </p>
            </div>
            <Switch
              id="autoplay"
              checked={autoplay}
              onCheckedChange={setAutoplay}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sound Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Sound
          </CardTitle>
          <CardDescription>
            Manage audio and sound effect settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sound-effects">Sound Effects</Label>
              <p className="text-sm text-muted-foreground">
                Play retro UI sounds for interactions
              </p>
            </div>
            <Switch
              id="sound-effects"
              checked={soundEffects}
              onCheckedChange={setSoundEffects}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AccountTab() {
  const { user, isLoaded } = useUser();
  const { openUserProfile, signOut } = useClerk();

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const userInitials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() || '?';

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile
          </CardTitle>
          <CardDescription>
            Your account information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user?.imageUrl} alt={user?.fullName || 'User'} />
              <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                {user?.fullName || 'User'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
              {user?.createdAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => openUserProfile()}
              className="flex-1"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Manage Account
            </Button>
            <Button
              variant="destructive"
              onClick={() => signOut({ redirectUrl: '/' })}
              className="flex-1"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Connected Accounts - Placeholder for future */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>
            Manage your connected services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No connected accounts. Connect services through your account settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Settings() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Main Content */}
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <SettingsIcon className="w-8 h-8" />
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your preferences and account settings
          </p>
        </motion.div>

        {/* Settings Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs defaultValue="preferences" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="preferences" className="gap-2">
                <SettingsIcon className="w-4 h-4" />
                Preferences
              </TabsTrigger>
              <TabsTrigger value="account" className="gap-2">
                <User className="w-4 h-4" />
                Account
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preferences">
              <PreferencesTab />
            </TabsContent>

            <TabsContent value="account">
              <AccountTab />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
