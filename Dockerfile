# Sử dụng image node 20 làm base
FROM node:20-alpine

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy các file package.json và package-lock.json
COPY package*.json ./

# Cài đặt các dependencies
RUN npm install

# Copy toàn bộ code vào container
COPY . .

# Generate Prisma Client (nếu dự án sử dụng Prisma)
RUN npx prisma generate

# Expose port mà ứng dụng chạy (thường là 3000)
EXPOSE 3000

# Lệnh khởi chạy ứng dụng (sử dụng npm run dev để hỗ trợ nodemon trong quá trình phát triển)
CMD ["npm", "run", "dev"]
