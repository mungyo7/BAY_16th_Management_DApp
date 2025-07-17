import { useState } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { currentUserAtom, isEditingAtom } from '../store/profileAtoms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit3, Save, X, User, Mail, Hash, GraduationCap, Building } from 'lucide-react';

export function ProfileForm() {
  const [currentUser, setCurrentUser] = useAtom(currentUserAtom);
  const [isEditing, setIsEditing] = useAtom(isEditingAtom);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    bio: currentUser?.bio || '',
    department: currentUser?.department || '',
    year: currentUser?.year || 1,
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        ...formData
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      bio: currentUser?.bio || '',
      department: currentUser?.department || '',
      year: currentUser?.year || 1,
    });
    setIsEditing(false);
  };

  if (!currentUser) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">프로필 정보를 불러올 수 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            프로필 정보
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={currentUser.isActive ? 'default' : 'secondary'}>
              {currentUser.isActive ? '활성' : '비활성'}
            </Badge>
            <Badge variant={currentUser.role === 'admin' ? 'destructive' : 'secondary'}>
              {currentUser.role === 'admin' ? '관리자' : '회원'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img
              src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`}
              alt={currentUser.name}
              className="w-20 h-20 rounded-full object-cover ring-2 ring-background"
            />
            {currentUser.role === 'admin' && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-sm">👑</span>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold">{currentUser.name}</h3>
            <p className="text-muted-foreground">{currentUser.email}</p>
            <p className="text-sm text-muted-foreground">
              가입일: {new Date(currentUser.joinDate).toLocaleDateString('ko-KR')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              이름
            </Label>
            {isEditing ? (
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="이름을 입력하세요"
              />
            ) : (
              <p className="text-sm p-2 bg-muted rounded">{currentUser.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              이메일
            </Label>
            {isEditing ? (
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="이메일을 입력하세요"
              />
            ) : (
              <p className="text-sm p-2 bg-muted rounded">{currentUser.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="studentId" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              학번
            </Label>
            <p className="text-sm p-2 bg-muted rounded">{currentUser.studentId}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              학과
            </Label>
            {isEditing ? (
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                placeholder="학과를 입력하세요"
              />
            ) : (
              <p className="text-sm p-2 bg-muted rounded">{currentUser.department}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="year" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              학년
            </Label>
            {isEditing ? (
              <Input
                id="year"
                type="number"
                min={1}
                max={4}
                value={formData.year}
                onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                placeholder="학년을 입력하세요"
              />
            ) : (
              <p className="text-sm p-2 bg-muted rounded">{currentUser.year}년</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">자기소개</Label>
          {isEditing ? (
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="자기소개를 입력하세요"
              className="w-full min-h-[100px] p-2 border border-border rounded-md resize-none"
            />
          ) : (
            <p className="text-sm p-2 bg-muted rounded min-h-[100px]">
              {currentUser.bio || '자기소개가 없습니다.'}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                취소
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                저장
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit3 className="h-4 w-4 mr-2" />
              수정
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}