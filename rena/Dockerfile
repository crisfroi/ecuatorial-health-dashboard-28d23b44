FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files
COPY ["rena/Qiandao.Web/Qiandao.Web.csproj", "Qiandao.Web/"]
COPY ["rena/Qiandao.Service/Qiandao.Service.csproj", "Qiandao.Service/"]
COPY ["rena/Qiandao.Model/Qiandao.Model.csproj", "Qiandao.Model/"]

# Restore dependencies
RUN dotnet restore "Qiandao.Web/Qiandao.Web.csproj"

# Copy source code
COPY rena/. .

# Build
WORKDIR "/src/Qiandao.Web"
RUN dotnet build "Qiandao.Web.csproj" -c Release -o /app/build

# Publish
FROM build AS publish
RUN dotnet publish "Qiandao.Web.csproj" -c Release -o /app/publish

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Copy published app
COPY --from=publish /app/publish .

# Expose port for Render
EXPOSE 8080

# Set environment variables for ASP.NET Core
ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production

# Start application
ENTRYPOINT ["dotnet", "Qiandao.Web.dll"]
