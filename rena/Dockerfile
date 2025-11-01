FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["Qiandao.Web/Qiandao.Web.csproj", "Qiandao.Web/"]
COPY ["Qiandao.Service/Qiandao.Service.csproj", "Qiandao.Service/"]
COPY ["Qiandao.Model/Qiandao.Model.csproj", "Qiandao.Model/"]
RUN dotnet restore "Qiandao.Web/Qiandao.Web.csproj"
COPY . .
WORKDIR "/src/Qiandao.Web"
RUN dotnet build "Qiandao.Web.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Qiandao.Web.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Qiandao.Web.dll"]
