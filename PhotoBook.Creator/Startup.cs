using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SpaServices.ReactDevelopmentServer;
using Microsoft.EntityFrameworkCore;
using PhotoBook.DataManager;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using NLog;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.IO;
using System.Linq;
using System.Security.Claims;
using Common.IdentityManager;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.Extensions.Logging;
using NLog.Extensions.Logging;
using Common.IdentityManager.Models;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.IdentityModel.Logging;


namespace PhotoBook.Creator
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            LogManager.LoadConfiguration(String.Concat(Directory.GetCurrentDirectory(), "/nlog.config"));
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }
        private static LoggerFactory MyLoggerFactory = new LoggerFactory(new[] { new NLogLoggerProvider() });

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {

            services.AddSingleton(Configuration);
            services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
            services.AddDbContext<DataContext>(options =>
                options.UseLoggerFactory(MyLoggerFactory)
#if DEBUG
                    .EnableSensitiveDataLogging()
#endif
                    .UseSqlServer(Configuration.GetConnectionString("PhotoBookConnection")));

            services.AddDbContext<IdentityContext>(options =>
                options.UseLoggerFactory(MyLoggerFactory)
#if DEBUG
                    .EnableSensitiveDataLogging()
#endif
                    .UseSqlServer(Configuration.GetConnectionString("IdentityConnection")));

            JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();
            services.AddIdentity<ApplicationUser, IdentityRole>()
                .AddEntityFrameworkStores<IdentityContext>()
                .AddDefaultTokenProviders();

            services.AddIdentityServer()
                .AddApiAuthorization<ApplicationUser, IdentityContext>()
                .AddProfileService<Controllers.ProfileService>();
                
            services.AddAuthentication(options =>
                {
                    options.DefaultScheme = "cookies";
                    options.DefaultChallengeScheme = "oidc";
                })
                .AddCookie("cookies",
                    options =>
                    {
                        options.LoginPath = "/Identity/Account/LogIn";
                        options.LogoutPath = "/Identity/Account/LogOff";
                        options.ForwardDefaultSelector = ctx =>
                            ctx.Request.Path.StartsWithSegments("/api") ? "jwt" : "cookies";
                    })
                .AddJwtBearer("jwt", options =>
                {
                    options.Authority = Configuration["oidc:Authority"];
                    options.Audience = "PhotoBook.CreatorAPI";
                    options.RequireHttpsMetadata = false;
                })
                .AddIdentityServerJwt()
                .AddOpenIdConnect("oidc", options =>
                {
                    options.SignInScheme = "cookies";
                    options.Authority = Configuration["oidc:Authority"];
                    options.RequireHttpsMetadata = false;
                    options.ClientId = Configuration["oidc:ClientId"];
                    options.SaveTokens = true;
                    options.ResponseType = "code id_token";
                    options.GetClaimsFromUserInfoEndpoint = true;
                    options.Scope.Add("api");
                    options.Scope.Add("offline_access");
                    options.ForwardDefaultSelector = ctx => ctx.Request.Path.StartsWithSegments("/api") ? "jwt" : "oidc";
                });
            IdentityModelEventSource.ShowPII = true;

            services.AddControllersWithViews();
            services.AddRazorPages();
            services.AddResponseCompression(options =>
            {
                options.EnableForHttps = true;
                options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(new[]
                {
                    "image/jpg"
                });
                options.Providers.Add<GzipCompressionProvider>();
            });
            // In production, the React files will be served from this directory
            services.AddSpaStaticFiles(configuration =>
            {
                configuration.RootPath = "ClientApp/build";
            });

            services.Configure<IISServerOptions>(options =>
            {
                options.AutomaticAuthentication = false;
            });

        }
        public Logger Logger = LogManager.GetCurrentClassLogger();
        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
#if DEBUG
            Logger.Trace("PhotoBook.Creator compiled using DEBUG configuration.");
#else 
            Logger.Trace("PhotoBook.Creator compiled using Release configuration.");
#endif
            if (env.IsDevelopment())
            {
                Logger.Trace("PhotoBook.Creator utilizing Development mode.");
                app.UseDeveloperExceptionPage();
                app.UseDatabaseErrorPage();
            }
            else
            {
                Logger.Trace("PhotoBook.Creator utilizing Production mode.");
                app.UseExceptionHandler(errorApp =>
                {
                    errorApp.Run(async context =>
                    {
                        context.Response.StatusCode = 500;
                        context.Response.ContentType = "text/html";

                        await context.Response.WriteAsync("<html lang=\"en\"><body>\r\n");
                        await context.Response.WriteAsync("ERROR!<br><br>\r\n");

                        var exceptionHandlerPathFeature =
                            context.Features.Get<IExceptionHandlerPathFeature>();

                        // Use exceptionHandlerPathFeature to process the exception (for example, 
                        // logging), but do NOT expose sensitive error information directly to 
                        // the client.
                        if(exceptionHandlerPathFeature != null)
                        {
                            if (exceptionHandlerPathFeature.Error is FileNotFoundException)
                            {
                                await context.Response.WriteAsync("File error thrown!<br><br>\r\n");
                            }
                            Logger.Error(exceptionHandlerPathFeature?.Error, $"Global Exception: {exceptionHandlerPathFeature.Error.Message}, {exceptionHandlerPathFeature.Error}");
                        }
                        else
                        {
                            Logger.Error($"Global Exception. exceptionHandlerPathFeature is null. ");
                        }
                        

                        await context.Response.WriteAsync("<a href=\"/\">Home</a><br>\r\n");
                        await context.Response.WriteAsync("</body></html>\r\n");
                        await context.Response.WriteAsync(new string(' ', 512)); // IE padding
                    });
                });
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }
            app.Use(async (context, next) =>
            {
                var principal = context.User as ClaimsPrincipal;
                var accessToken = principal?.Claims
                    .FirstOrDefault(c => c.Type == "access_token");

                if (accessToken != null)
                {
                    Logger.Debug(accessToken.Value);
                }

                await next();
            });

            app.UseResponseCompression();
            app.UseHttpsRedirection();
            app.UseStaticFiles();
            app.UseSpaStaticFiles();

            app.UseRouting();

            app.UseAuthentication();
            app.UseIdentityServer();
            app.UseAuthorization();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllerRoute(
                    name: "default",
                    pattern: "{controller}/{action=Index}/{id?}");
                endpoints.MapRazorPages();
            });

            app.UseSpa(spa =>
            {
                spa.Options.SourcePath = "ClientApp";

                if (env.IsDevelopment())
                {
                    spa.UseReactDevelopmentServer(npmScript: "start");
                }
            });
        }
    }
}
