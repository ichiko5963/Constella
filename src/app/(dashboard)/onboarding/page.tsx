/**
 * オンボーディングページ
 * P1-1: オンボーディング機能
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { generateFolderStructure, completeOnboarding } from '@/server/actions/onboarding';
import { toast } from 'sonner';

type PlanType = 'one' | 'company';
type Step = 'plan' | 'business' | 'departments' | 'purpose' | 'preview';

interface FolderStructure {
  name: string;
  children?: FolderStructure[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('plan');
  const [planType, setPlanType] = useState<PlanType | null>(null);
  const [businessCount, setBusinessCount] = useState(1);
  const [businessNames, setBusinessNames] = useState<string[]>(['']);
  const [departmentCounts, setDepartmentCounts] = useState<Record<number, number>>({});
  const [departmentNames, setDepartmentNames] = useState<Record<number, string[]>>({});
  const [mainPurpose, setMainPurpose] = useState<string[]>([]);
  const [folderStructure, setFolderStructure] = useState<FolderStructure[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const handlePlanSelect = (plan: PlanType) => {
    setPlanType(plan);
    setStep(plan === 'one' ? 'purpose' : 'business');
  };

  const handleBusinessCountChange = (count: number) => {
    setBusinessCount(count);
    const newNames = Array(count).fill('').map((_, i) => businessNames[i] || '');
    setBusinessNames(newNames);
  };

  const handleNextFromBusiness = () => {
    if (businessNames.some(name => !name.trim())) {
      toast.error('すべての事業名を入力してください');
      return;
    }
    setStep('departments');
  };

  const handleNextFromDepartments = () => {
    const allDepartmentsNamed = businessNames.every((_, idx) => {
      const count = departmentCounts[idx] || 0;
      const names = departmentNames[idx] || [];
      return names.length === count && names.every(n => n.trim());
    });

    if (!allDepartmentsNamed) {
      toast.error('すべての部門名を入力してください');
      return;
    }
    setStep('purpose');
  };

  const handleGenerateStructure = async () => {
    setIsGenerating(true);
    try {
      const structure = await generateFolderStructure({
        planType: planType!,
        businessCount,
        businessNames: planType === 'company' ? businessNames : undefined,
        departmentCounts: planType === 'company' ? departmentCounts : undefined,
        departmentNames: planType === 'company' ? departmentNames : undefined,
        mainPurpose,
      });
      setFolderStructure(structure);
      setStep('preview');
      toast.success('フォルダ構造を生成しました');
    } catch (error) {
      toast.error('フォルダ構造の生成に失敗しました');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await completeOnboarding(
        {
          planType: planType!,
          businessCount,
          businessNames: planType === 'company' ? businessNames : undefined,
          departmentCounts: planType === 'company' ? departmentCounts : undefined,
          departmentNames: planType === 'company' ? departmentNames : undefined,
          mainPurpose,
        },
        folderStructure
      );
      toast.success('オンボーディングが完了しました！');
      router.push('/dashboard');
    } catch (error) {
      toast.error('オンボーディングの完了に失敗しました');
      console.error(error);
    } finally {
      setIsCompleting(false);
    }
  };

  const renderFolderTree = (folders: FolderStructure[], depth: number = 0) => {
    return (
      <ul className={`space-y-1 ${depth > 0 ? 'ml-6 border-l pl-4' : ''}`}>
        {folders.map((folder, index) => (
          <li key={index}>
            <div className="flex items-center gap-2">
              <span className="text-lg">📁</span>
              <span className="font-medium">{folder.name}</span>
            </div>
            {folder.children && folder.children.length > 0 && renderFolderTree(folder.children, depth + 1)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-2xl w-full bg-card rounded-xl shadow-lg p-8">
        {/* ステップインジケーター */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {['plan', 'business', 'purpose', 'preview'].map((s, i) => {
              const stepIndex = ['plan', 'business', 'departments', 'purpose', 'preview'].indexOf(step);
              const currentIndex = ['plan', 'business', 'departments', 'purpose', 'preview'].indexOf(s as Step);
              const isActive = stepIndex >= currentIndex;
              
              return (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {i + 1}
                  </div>
                  {i < 3 && <div className={`w-12 h-1 ${isActive ? 'bg-primary' : 'bg-muted'}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* プラン選択 */}
        {step === 'plan' && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">Actoryへようこそ！</h1>
              <p className="text-muted-foreground">まず、使用プランを選択してください</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handlePlanSelect('one')}
                className="p-6 border-2 rounded-lg hover:border-primary transition-colors text-left"
              >
                <div className="text-2xl mb-2">👤</div>
                <h3 className="font-bold mb-1">Actory for One</h3>
                <p className="text-sm text-muted-foreground">個人用のナレッジ管理</p>
              </button>

              <button
                onClick={() => handlePlanSelect('company')}
                className="p-6 border-2 rounded-lg hover:border-primary transition-colors text-left"
              >
                <div className="text-2xl mb-2">🏢</div>
                <h3 className="font-bold mb-1">Actory for Company</h3>
                <p className="text-sm text-muted-foreground">チーム・組織用</p>
              </button>
            </div>
          </div>
        )}

        {/* 事業情報入力 */}
        {step === 'business' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">事業情報を入力</h2>
              <p className="text-muted-foreground">御社の事業構造を教えてください</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>事業数（1-10）</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={businessCount}
                  onChange={(e) => handleBusinessCountChange(parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>

              {Array.from({ length: businessCount }).map((_, index) => (
                <div key={index}>
                  <Label>事業 {index + 1} の名前</Label>
                  <Input
                    value={businessNames[index] || ''}
                    onChange={(e) => {
                      const newNames = [...businessNames];
                      newNames[index] = e.target.value;
                      setBusinessNames(newNames);
                    }}
                    placeholder="例: 営業部門"
                    className="mt-1"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep('plan')}>
                戻る
              </Button>
              <Button onClick={handleNextFromBusiness}>次へ</Button>
            </div>
          </div>
        )}

        {/* 部門情報入力 */}
        {step === 'departments' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">部門情報を入力</h2>
              <p className="text-muted-foreground">各事業の部門を教えてください</p>
            </div>

            <div className="space-y-6">
              {businessNames.map((businessName, businessIndex) => (
                <div key={businessIndex} className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-bold">{businessName}</h3>
                  
                  <div>
                    <Label>部門数（1-10）</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={departmentCounts[businessIndex] || 1}
                      onChange={(e) => {
                        const count = parseInt(e.target.value) || 1;
                        setDepartmentCounts({ ...departmentCounts, [businessIndex]: count });
                        const newNames = Array(count).fill('').map((_, i) => 
                          departmentNames[businessIndex]?.[i] || ''
                        );
                        setDepartmentNames({ ...departmentNames, [businessIndex]: newNames });
                      }}
                      className="mt-1"
                    />
                  </div>

                  {Array.from({ length: departmentCounts[businessIndex] || 1 }).map((_, deptIndex) => (
                    <div key={deptIndex}>
                      <Label>部門 {deptIndex + 1}</Label>
                      <Input
                        value={departmentNames[businessIndex]?.[deptIndex] || ''}
                        onChange={(e) => {
                          const newNames = { ...departmentNames };
                          if (!newNames[businessIndex]) newNames[businessIndex] = [];
                          newNames[businessIndex][deptIndex] = e.target.value;
                          setDepartmentNames(newNames);
                        }}
                        placeholder="例: 営業部"
                        className="mt-1"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep('business')}>
                戻る
              </Button>
              <Button onClick={handleNextFromDepartments}>次へ</Button>
            </div>
          </div>
        )}

        {/* 主な用途選択 */}
        {step === 'purpose' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">主な用途を選択</h2>
              <p className="text-muted-foreground">Actoryで何をしたいですか？（複数選択可）</p>
            </div>

            <div className="space-y-3">
              {[
                { value: 'meeting', label: '会議記録の管理' },
                { value: 'task', label: 'タスク管理' },
                { value: 'knowledge', label: 'ナレッジ蓄積' },
                { value: 'content', label: 'コンテンツ生成' },
                { value: 'other', label: 'その他' },
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <input
                    type="checkbox"
                    checked={mainPurpose.includes(option.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setMainPurpose([...mainPurpose, option.value]);
                      } else {
                        setMainPurpose(mainPurpose.filter(p => p !== option.value));
                      }
                    }}
                    className="w-5 h-5"
                  />
                  <span className="font-medium">{option.label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setStep(planType === 'company' ? 'departments' : 'plan')}
              >
                戻る
              </Button>
              <Button onClick={handleGenerateStructure} disabled={isGenerating || mainPurpose.length === 0}>
                {isGenerating ? 'フォルダ構造を生成中...' : 'フォルダ構造を生成'}
              </Button>
            </div>
          </div>
        )}

        {/* プレビュー */}
        {step === 'preview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">フォルダ構造のプレビュー</h2>
              <p className="text-muted-foreground">自動生成されたフォルダ構造を確認してください</p>
            </div>

            <div className="border rounded-lg p-6 bg-muted/20 max-h-96 overflow-y-auto">
              {renderFolderTree(folderStructure)}
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep('purpose')}>
                戻る
              </Button>
              <Button onClick={handleComplete} disabled={isCompleting}>
                {isCompleting ? '完了中...' : '完了'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

