import os
import shutil

# Функция для замены файлов
def replace_file(old_path, new_path):
    if os.path.exists(new_path):
        print(f"Замена {old_path} на {new_path}")
        shutil.copy2(new_path, old_path)
    else:
        print(f"Файл {new_path} не найден")

# Список замен
replacements = [
    ("src/index.tsx", "src/index_new.tsx"),
    ("src/components/GameSyncMain.tsx", "src/components/GameSyncMain_new.tsx"),
    ("src/components/GameList.tsx", "src/components/GameList_new.tsx"),
    ("src/components/Settings.tsx", "src/components/Settings_new.tsx"),
    ("src/components/GamePathEditor.tsx", "src/components/GamePathEditor_new.tsx")
]

# Выполнение замен
for old_file, new_file in replacements:
    replace_file(old_file, new_file)

print("Обновление плагина завершено!")
