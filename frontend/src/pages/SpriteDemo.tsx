import AvatarSprite from '../components/AvatarSprite';

export default function SpriteDemo() {
  const name = 'Albert Einstein';
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Sprite Demo</h1>
      <p className="mb-6">Preview of the custom sprite when name is "Albert Einstein".</p>
      <div className="flex items-center gap-8 flex-wrap">
        <div className="flex flex-col items-center gap-2">
          <AvatarSprite name={name} size={32} theme="famous_figures" />
          <span className="text-sm">32px</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <AvatarSprite name={name} size={48} theme="famous_figures" />
          <span className="text-sm">48px</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <AvatarSprite name={name} size={64} theme="famous_figures" />
          <span className="text-sm">64px</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <AvatarSprite name={name} size={96} theme="famous_figures" />
          <span className="text-sm">96px</span>
        </div>
      </div>
      <div className="mt-8">
        <p className="text-gray-600 dark:text-gray-300">Label:</p>
        <p className="font-semibold">{name}</p>
      </div>
    </div>
  );
}
