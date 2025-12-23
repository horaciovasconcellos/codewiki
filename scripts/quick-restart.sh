#!/bin/bash

# Reinício rápido - apenas restart dos containers

echo "Reiniciando containers rapidamente..."
echo ""

docker-compose restart

echo ""
echo "✓ Containers reiniciados!"
echo ""
echo "Para verificar status:"
echo "  docker-compose ps"
echo ""
echo "Para ver logs:"
echo "  docker-compose logs -f app"
echo ""
