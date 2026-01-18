echo "=== Major Project Backend Build ==="
echo ""

cd "$(dirname "$0")/c_modules"

# Determine platform
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    OUTPUT="verdant_backend.dll"
    echo "[1/2] Compiling for Windows..."
    gcc -shared -o "$OUTPUT" \
        backend_data.c \
        backend_ai.c \
        backend_core.c \
        backend_logistics.c \
        backend_nutrition.c \
        -lm -O2
else
    OUTPUT="verdant_backend.so"
    echo "[1/2] Compiling for Linux/macOS..."
    gcc -shared -fPIC -o "$OUTPUT" \
        backend_data.c \
        backend_ai.c \
        backend_core.c \
        backend_logistics.c \
        backend_nutrition.c \
        -lm -O2
fi

if [ $? -eq 0 ]; then
    echo "✓ Backend compiled successfully: $OUTPUT"
    echo ""
    echo "[2/2] Moving to backend directory..."
    mv "$OUTPUT" ../
    echo "✓ Build complete!"
    echo ""
    echo "Next steps:"
    echo "  1. cd backend"
    echo "  2. python server.py"
else
    echo "✗ Compilation failed!"
    exit 1
fi
