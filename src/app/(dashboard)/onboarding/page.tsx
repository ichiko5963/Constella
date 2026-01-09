/**
 * オンボーディングページ
 * Constella setup wizard
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { generateFolderStructure, completeOnboarding } from '@/server/actions/onboarding';
import { toast } from 'sonner';
import { Star, Users, User, ChevronRight } from 'lucide-react';

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
      toast.success('Stella構造を生成しました');
    } catch (error) {
      toast.error('Stella構造の生成に失敗しました');
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
      toast.success('セットアップが完了しました！');
      router.push('/dashboard');
    } catch (error) {
      toast.error('セットアップの完了に失敗しました');
      console.error(error);
    } finally {
      setIsCompleting(false);
    }
  };

  const renderFolderTree = (folders: FolderStructure[], depth: number = 0) => {
    return (
      <ul className={`space-y-1 ${depth > 0 ? 'ml-6 border-l border-gray-200 pl-4' : ''}`}>
        {folders.map((folder, index) => (
          <li key={index}>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-900">{folder.name}</span>
            </div>
            {folder.children && folder.children.length > 0 && renderFolderTree(folder.children, depth + 1)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl border border-gray-200 shadow-xl p-8">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {['plan', 'business', 'purpose', 'preview'].map((s, i) => {
              const stepIndex = ['plan', 'business', 'departments', 'purpose', 'preview'].indexOf(step);
              const currentIndex = ['plan', 'business', 'departments', 'purpose', 'preview'].indexOf(s as Step);
              const isActive = stepIndex >= currentIndex;

              return (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                      isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {i + 1}
                  </div>
                  {i < 3 && <div className={`w-12 h-1 transition-colors ${isActive ? 'bg-gray-900' : 'bg-gray-100'}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Plan Selection */}
        {step === 'plan' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-900 flex items-center justify-center">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Constellaへようこそ</h1>
              <p className="text-gray-500">使用プランを選択してください</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handlePlanSelect('one')}
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-gray-900 transition-colors text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-gray-900 flex items-center justify-center mb-3 transition-colors">
                  <User className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Personal</h3>
                <p className="text-sm text-gray-500">個人用のナレッジ管理</p>
              </button>

              <button
                onClick={() => handlePlanSelect('company')}
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-gray-900 transition-colors text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-gray-900 flex items-center justify-center mb-3 transition-colors">
                  <Users className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Team</h3>
                <p className="text-sm text-gray-500">チーム・組織用</p>
              </button>
            </div>
          </div>
        )}

        {/* Business Info */}
        {step === 'business' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">事業情報を入力</h2>
              <p className="text-gray-500">御社の事業構造を教えてください</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-700">事業数（1-10）</Label>
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
                  <Label className="text-gray-700">事業 {index + 1} の名前</Label>
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
              <Button onClick={handleNextFromBusiness}>
                次へ
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Departments Info */}
        {step === 'departments' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">部門情報を入力</h2>
              <p className="text-gray-500">各事業の部門を教えてください</p>
            </div>

            <div className="space-y-6">
              {businessNames.map((businessName, businessIndex) => (
                <div key={businessIndex} className="border border-gray-200 rounded-xl p-4 space-y-4">
                  <h3 className="font-bold text-gray-900">{businessName}</h3>

                  <div>
                    <Label className="text-gray-700">部門数（1-10）</Label>
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
                      <Label className="text-gray-700">部門 {deptIndex + 1}</Label>
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
              <Button onClick={handleNextFromDepartments}>
                次へ
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Purpose Selection */}
        {step === 'purpose' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">主な用途を選択</h2>
              <p className="text-gray-500">Constellaで何をしたいですか？（複数選択可）</p>
            </div>

            <div className="space-y-3">
              {[
                { value: 'meeting', label: '会議記録の管理' },
                { value: 'task', label: 'タスク管理' },
                { value: 'knowledge', label: 'ナレッジ蓄積' },
                { value: 'content', label: 'コンテンツ生成' },
                { value: 'other', label: 'その他' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${
                    mainPurpose.includes(option.value)
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
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
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <span className="font-medium text-gray-900">{option.label}</span>
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
                {isGenerating ? 'Stella構造を生成中...' : 'Stella構造を生成'}
              </Button>
            </div>
          </div>
        )}

        {/* Preview */}
        {step === 'preview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Stella構造のプレビュー</h2>
              <p className="text-gray-500">自動生成されたStella構造を確認してください</p>
            </div>

            <div className="border border-gray-200 rounded-xl p-6 bg-gray-50 max-h-96 overflow-y-auto">
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
