
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Qiandao.Service;
using Qiandao.Web.WebSocketHandler;
using System.Net;
using WebSocketSharp.Server;
using System;
using Serilog;
using Serilog.Events;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

public class Program
{
    public static async Task Main(string[] args)
    {
        // Configure Serilog
        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Information()  // Set minimum logging level
            .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)  // Override for Microsoft logs
            .Enrich.FromLogContext()  // Enrich logs with context information
            .WriteTo.Console()  // Output to the console
            .WriteTo.File("Logs/app-log-.txt", rollingInterval: RollingInterval.Day)  // Log to a file
            .CreateLogger();

        try
        {
            Log.Information("Starting up the application...");
            var builder = WebApplication.CreateBuilder(args);

            // Configure services
            builder.Services.AddControllersWithViews();
            builder.Services.AddDbContext<Db>(options =>
                options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
            builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

            // Register your services
            builder.Services.AddScoped<Access_dayService>();
            builder.Services.AddScoped<Access_weekService>();
            builder.Services.AddScoped<DeviceService>(); // Restaurado
            builder.Services.AddScoped<EnrollinfoService>();
            builder.Services.AddScoped<PersonService>();
            builder.Services.AddScoped<RecordService>();
            builder.Services.AddHostedService<SendOrderJob>();
            builder.Services.AddScoped<Machine_commandService>();
            builder.Services.AddSingleton<DeviceManager>(); // Agregado

            // WebSocket services (anteriormente de WebSocketSharp)
            // builder.Services.AddSingleton<WebSocketServer>();
            // builder.Services.AddSingleton<WebSocketHandler>();
            // builder.Services.AddSingleton<ServerManager>();

            // Agrega el nuevo WebSocketHandler como un servicio de ámbito si usa DI de ASP.NET Core
            builder.Services.AddScoped<WebSocketHandler>();
            // Use Serilog as the logging provider
            builder.Host.UseSerilog();

            // Build the app
            var app = builder.Build();

            // Configure the HTTP request pipeline
            if (!app.Environment.IsDevelopment())
            {
                app.UseExceptionHandler("/Home/Error");
                app.UseHsts();
            }

            // app.UseHttpsRedirection(); // Deshabilitado para Render
            app.UseStaticFiles();
            app.UseRouting();
            app.UseAuthorization();

            // Configure routes
            app.MapControllers();
            app.MapControllerRoute(
                name: "default",
                pattern: "{controller=Home}/{action=Index}/{id?}");

            // Habilita el middleware de WebSockets de ASP.NET Core
            app.UseWebSockets();

            // Mapea la ruta para tu WebSocketHandler a /ws
            app.Map("/ws", builder => // Cambiado a /ws
            {
                builder.Run(async context =>
                {
                    if (context.WebSockets.IsWebSocketRequest)
                    {
                        using var webSocket = await context.WebSockets.AcceptWebSocketAsync();
                        var webSocketHandler = context.RequestServices.GetRequiredService<WebSocketHandler>();
                        await webSocketHandler.HandleWebSocketAsync(context, webSocket);
                    }
                    else
                    {
                        context.Response.StatusCode = StatusCodes.Status400BadRequest;
                        await Task.CompletedTask;
                    }
                });
            });
            
            // Start WebSocket server (anteriormente de WebSocketSharp)
            // var webSocketServer = app.Services.GetRequiredService<ServerManager>();
            // webSocketServer.Start();

            // Run the app
            app.Run();
        }
        catch (Exception ex)
        {
            Log.Fatal(ex, "The application failed to start correctly.");
        }
        finally
        {
            Log.CloseAndFlush();
        }
    }
    public static IConfigurationRoot GetConfiguration()
    {
        var builder = new ConfigurationBuilder()
            .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
            .AddEnvironmentVariables();

        return builder.Build();
    }
}