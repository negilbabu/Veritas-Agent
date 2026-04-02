# Stage 1: Build stage
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend code
COPY frontend/ .

# Define the build arguments
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_API_URL
# Set them as environment variables for the build process
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# ADD THIS LINE TO DEBUG:
RUN echo "DEBUG CHECK - Google ID is: ${NEXT_PUBLIC_GOOGLE_CLIENT_ID}"
# Build the application
RUN npm run build

# Stage 2: Runtime stage
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files from the builder
# Use a wildcard to catch next.config.js OR next.config.mjs
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Start the built production server
CMD ["npm", "start"]