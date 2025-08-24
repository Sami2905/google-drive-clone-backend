import { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { FileGridItem } from '@/types';
import { apiClient } from '@/lib/api-client';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FileGridItem;
}

interface ShareSettings {
  password?: string;
  expiry?: string;
  allow_download: boolean;
  allow_reshare: boolean;
}

interface AccessListItem {
  id: string;
  email: string;
  role: string;
}

interface ShareResponse {
  success: boolean;
  data: {
    id: string;
    link: string;
    password?: string;
    expiry?: string;
    allow_download: boolean;
    allow_reshare: boolean;
  };
}

interface PermissionsResponse {
  success: boolean;
  data: Array<{
    id: string;
    email: string;
    role: string;
  }>;
}

export default function ShareDialog({
  open,
  onOpenChange,
  item,
}: ShareDialogProps) {
  const [shareLink, setShareLink] = useState('');
  const [settings, setSettings] = useState<ShareSettings>({
    allow_download: true,
    allow_reshare: false,
  });
  const [accessList, setAccessList] = useState<AccessListItem[]>([]);
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    if (open) {
      loadShareSettings();
    }
  }, [open]);

  const loadShareSettings = useCallback(async () => {
    try {
      const response = await apiClient.getShareByToken(item.id) as ShareResponse;
      if (response.success) {
        setShareLink(response.data.link);
        setSettings({
          password: response.data.password,
          expiry: response.data.expiry,
          allow_download: response.data.allow_download,
          allow_reshare: response.data.allow_reshare,
        });
      }

      const accessResponse = await apiClient.getPermissions(item.id, item.type) as PermissionsResponse;
      if (accessResponse.success) {
        setAccessList(accessResponse.data.map((p) => ({
          id: p.id,
          email: p.email,
          role: p.role,
        })));
      }
    } catch (error) {
      console.error('Failed to load share settings:', error);
    }
  }, [item]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(shareLink);
  }, [shareLink]);

  const handleExpiryChange = useCallback((value: string) => {
    setSettings(prev => ({ ...prev, expiry: value }));
  }, []);

  const handleAddEmail = useCallback(async () => {
    if (!newEmail) return;

    try {
      const response = await apiClient.shareFile(item.id, 7) as ShareResponse;
      if (response.success) {
        setAccessList(prev => [...prev, {
          id: response.data.id,
          email: newEmail,
          role: 'viewer',
        }]);
        setNewEmail('');
      }
    } catch (error) {
      console.error('Failed to share file:', error);
    }
  }, [item, newEmail]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share {item.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Share Link</Label>
            <div className="flex space-x-2">
              <Input value={shareLink} readOnly />
              <Button onClick={handleCopyLink}>Copy</Button>
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <div>
              <Label>Password Protection</Label>
              <Input
                type="password"
                value={settings.password}
                onChange={(e) => setSettings({ ...settings, password: e.target.value })}
                placeholder="Optional password"
              />
            </div>
            <div>
              <Label>Link Expiry</Label>
              <Input
                type="date"
                value={settings.expiry}
                onChange={(e) => handleExpiryChange(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Allow Download</Label>
              <Switch
                checked={settings.allow_download}
                onCheckedChange={(checked: boolean) => setSettings({ ...settings, allow_download: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Allow Reshare</Label>
              <Switch
                checked={settings.allow_reshare}
                onCheckedChange={(checked: boolean) => setSettings({ ...settings, allow_reshare: checked })}
              />
            </div>
          </div>
          <Separator />
          <div>
            <Label>Share with People</Label>
            <div className="flex space-x-2">
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter email address"
              />
              <Button onClick={handleAddEmail}>Add</Button>
            </div>
            <div className="mt-4 space-y-2">
              {accessList.map(access => (
                <div
                  key={access.id}
                  className="flex items-center justify-between p-2 bg-muted rounded-lg"
                >
                  <span>{access.email}</span>
                  <span className="text-sm text-muted-foreground">{access.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}