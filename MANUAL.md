# Manual de Despliegue con Docker

Esta guía proporciona instrucciones para desplegar la aplicación utilizando Docker y Docker Compose.

## Requisitos

- Docker instalado
- Docker Compose instalado

## Pasos para el Despliegue

1. **Construir las imágenes de Docker:**

   ```bash
   docker-compose build
   ```

2. **Iniciar los contenedores:**

   ```bash
   docker-compose up -d
   ```

3. **Verificar el estado de los contenedores:**

   ```bash
   docker-compose ps
   ```

4. **Acceder a la aplicación:**

   - La interfaz de usuario estará disponible en `http://localhost:80`
   - El servidor backend estará en `http://localhost:3001`

5. **Detener los contenedores:**

   ```bash
   docker-compose down
   ```
