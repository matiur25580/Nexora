FROM node:22-alpine
WORKDIR /workspace
COPY package.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN npm install
COPY tsconfig.base.json ./
COPY apps/api ./apps/api
RUN npm run build --workspace @nexora/api
EXPOSE 4000
CMD ["npm", "run", "start", "--workspace", "@nexora/api"]
