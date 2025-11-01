using Qiandao.Model.Entity;
using Qiandao.Model.Response;
using AutoMapper;
using Microsoft.Extensions.Logging;
using Npgsql;
using Microsoft.EntityFrameworkCore;
namespace Qiandao.Service
{

    /// <summary>
    ///person服务
    /// </summary>
    public class PersonService : IScope
    {
        private readonly object _lockObject = new object();  // 专门的锁对象
        private bool _disposed = false;  // 标记是否已释放资源
        public void Dispose()
        { }

        private readonly ILogger<PersonService> _logger;
        private readonly Db _db;
        private readonly IMapper _mapper;
        private readonly EnrollinfoService enrollinfoService;
        private readonly  Machine_commandService machine_CommandService;
        public PersonService(Db db, IMapper mapper, ILogger<PersonService> logger, EnrollinfoService _enrollinfoService, Machine_commandService _machine_CommandService)
        {
            _logger = logger;
            _db = db ?? throw new ArgumentNullException(nameof(db));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
            this.enrollinfoService = _enrollinfoService;
            this.machine_CommandService = _machine_CommandService;
        }
        /// <summary>
        /// 添加enrollinfo
        /// </summary>
        public ResponseModel AddPerson(Person addPerson)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                var response = AddPersonAsync(addPerson);
                return response;
            }
        }
        public ResponseModel AddPersonAsync(Person aperson)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                using (var transaction = _db.Database.BeginTransaction())
                {
                    try
                    {
                        _db.person.Add(aperson);
                        int rowsAffected = _db.SaveChanges();
                        if (rowsAffected > 0)
                        {
                            transaction.Commit();
                            return new ResponseModel { Code = 200, Result = "Success" };
                        }
                        else
                        {
                            transaction.Rollback();
                            return new ResponseModel { Code = 0, Result = "Fail" };
                        }
                    }
                    catch (Exception ex)
                    {
                        return new ResponseModel { Code = 0, Result = "fail：" + ex.Message };
                    }
                }
            }
        }

        public ResponseModel GetPersonList(int page, int limit)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                var skipCount = (page-1) * limit;
                // 构建动态 SQL 查询
                var sqlQuery = $@"
    WITH CTE AS (
    SELECT *
    FROM person
    ORDER BY id ASC
    LIMIT @Limit OFFSET @SkipCount";
                // 创建参数列表
                var parameters = new List<NpgsqlParameter>
    {
        new NpgsqlParameter("@SkipCount", skipCount),
        new NpgsqlParameter("@Limit", limit)
    };

                // 执行查询
                var query = _db.Database.SqlQueryRaw<Person>(sqlQuery, parameters.ToArray());
                // 获取查询结果
                
                if (query==null) {
                    return new ResponseModel();
                }
                    var queryResult = query.ToList();
                ResponseModel responseModel = new ResponseModel();
                responseModel.Data = new List<Person>();
                    foreach (var comment in queryResult)
                    {
                        responseModel.Data.Add(new Person
                        {
                            Id = comment.Id,
                            Roll_id = comment.Roll_id,
                            Name = comment.Name
                        });
                    }
                    responseModel.Code = 200;
                    responseModel.Result = "Person list success";
                    return responseModel;
                
            }
        }
        /// <summary>
        /// 
        /// </summary>
        public async Task<ResponseModel> GetPersonallList()
        {
            using (var semaphore = new SemaphoreSlim(1, 1))
            {
                await semaphore.WaitAsync();  // 异步等待
                var query = _db.Database.SqlQueryRaw<Person>(@"SELECT * FROM person");
                if (query == null)
                {
                    return new ResponseModel();
                }
                // 执行查询并返回结果
                var queryResult = query.ToList();
                ResponseModel responseModel = new ResponseModel();
                responseModel.Data = new List<Person>();
                foreach (var comment in queryResult)
                {
                    responseModel.Data.Add(new Person
                    {
                        Id = comment.Id,
                        Roll_id = comment.Roll_id,
                        Name = comment.Name
                    });
                }
                semaphore.Release();
                responseModel.Code = 200;
                responseModel.Result = "Person list success";
                return responseModel;
            }
        }


        public async Task<Person> SelectByPrimaryKey(long id)
        {
            using (var semaphore = new SemaphoreSlim(1, 1))
            {
                await semaphore.WaitAsync();  // 异步等待
                var sqlQuery = $@"SELECT * FROM person WHERE id = @id";
                var parameters = new NpgsqlParameter[]
                {
                new NpgsqlParameter("@id", id)
                };

                try
                {
                    var query = _db.Database.SqlQueryRaw<Person>(sqlQuery, parameters);
                    var queryResult = query.ToList();
                    semaphore.Release();
                    return queryResult.Count > 0 ? queryResult[0] : null;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error");
                    return null;
                }
            }
        }
        public ResponseModel DeleteUserInfoFromDevice(int enrollId, string deviceSn)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                int backupNum = 13;
                string message = "{\"cmd\":\"deleteuser\",\"enrollid\":" + enrollId + ",\"backupnum\":" + backupNum + "}";
                DateTime dt = DateTime.Now;
                Machine_command machineCommand = new Machine_command
                {
                    Content = message,
                    Name = "deleteuser",
                    Status = 0,
                    Send_status = 0,
                    Err_count = 0,
                    Serial = deviceSn,
                    Gmt_crate = dt,
                    Gmt_modified = dt,
                };

                using (var transaction = _db.Database.BeginTransaction())
                {
                    try
                    {
                        _db.machine_command.Add(machineCommand);
                        int rowsAffected = _db.SaveChanges();

                        if (rowsAffected > 0)
                        {
                            // 根据业务需求选择合适的删除方法
                            DeletePersonByEnrollId(enrollId);

                            transaction.Commit();
                            return new ResponseModel { Code = 200, Result = "Delete success" };
                        }
                        else
                        {
                            transaction.Rollback();
                            return new ResponseModel { Code = 0, Result = "Add fail" };
                        }
                    }
                    catch (Exception ex)
                    {
                        return new ResponseModel { Code = 0, Result = "fail：" + ex.Message };
                    }
                }
            }
        }

        public void DeletePersonByEnrollId(int id)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                _db.Database.ExecuteSqlRaw("DELETE FROM person WHERE id = @id", new NpgsqlParameter("@id", id));
                _db.Database.ExecuteSqlRaw("DELETE FROM enrollinfo WHERE enroll_id = @id", new NpgsqlParameter("@id", id));
            }
        }
       
            public async Task<ResponseModel> getUserInfo(string deviceSn)
        {
            using (var semaphore = new SemaphoreSlim(1, 1))
            {
                await semaphore.WaitAsync();  // 异步等待
                                              // 获取设备列表
                var response = await GetPersonallList();
            if (response == null || response.Data == null)
            {
                return new ResponseModel { Code = 0, Result = "null" };
            }
            var personList = response.Data as List<Person>;
            var now = DateTime.Now;
            foreach (var person in personList)
            {
                var enrollId = person.Id;
                var enrollResponse =await enrollinfoService.SelectEnrollallByIdAsync(enrollId);
                if ((enrollResponse != null) && (enrollResponse.Data != null))
                {
                    var enrollInfos = enrollResponse.Data as List<Enrollinfo>;
                    for (int j = 0; j < enrollInfos.Count; j++)
                    {
                            if (enrollInfos[j].Enroll_id != null && enrollInfos[j].Backupnum != null)
                            {
                                using (var transaction = _db.Database.BeginTransaction())
                                {

                                    var message = $"{{\"cmd\":\"getuserinfo\",\"enrollid\":{enrollInfos[j].Enroll_id},\"backupnum\":{enrollInfos[j].Backupnum}}}";
                                    var machineCommand = new Machine_command
                                    {
                                        Content = message,
                                        Name = "getuserinfo",
                                        Status = 0,
                                        Send_status = 0,
                                        Err_count = 0,
                                        Serial = deviceSn,
                                        Gmt_crate = now,
                                        Gmt_modified = now
                                    };
                                    try
                                    {
                                        _db.machine_command.Add(machineCommand);
                                        var rowsAffected = _db.SaveChanges();
                                        if (rowsAffected > 0)
                                        {
                                            transaction.Commit();
                                        }
                                        else
                                        {
                                            transaction.Rollback();
                                        }
                                    }
                                    catch (Exception ex)
                                    {
                                        // 记录异常信息
                                        Console.WriteLine($"Error: {ex.Message}");
                                    }
                                }
                            }
                        }
                    }
                }
            semaphore.Release();
            }
        
            return new ResponseModel { Code = 200, Result = "Add success" };
        }

        public async void setUserToDevice2(string deviceSn)
        {
            using (var semaphore = new SemaphoreSlim(1, 1))
            {
                await semaphore.WaitAsync();  // 异步等待
                ResponseModel pm = await GetPersonallList();
                List<UserInfo> userInfos = await enrollinfoService.usersToSendDevice(pm);
                DateTime dt = DateTime.Now;
                for (int i = 0; i < userInfos.Count(); i++)
                {
                    long? enrollId = userInfos[i].EnrollId;
                    string name = userInfos[i].Name;
                    int? backupnum = userInfos[i].Backupnum;
                    int? admin = userInfos[i].Admin;
                    string? record = userInfos[i].Record;
                    Machine_command machineCommand = new Machine_command
                    {
                        Name = "setuserinfo",
                        Status = 0,
                        Send_status = 0,
                        Err_count = 0,
                        Serial = deviceSn,
                        Gmt_crate = dt,
                        Gmt_modified = dt
                    };
                    machineCommand.Content = "{\"cmd\":\"setuserinfo\",\"enrollid\":" + enrollId + ",\"name\":\"" + name + "\",\"backupnum\":" + backupnum
                            + ",\"admin\":" + admin + ",\"record\":\"" + record + "\"}";
                    if (backupnum == 11 || backupnum == 10)
                    {
                        machineCommand.Content = "{\"cmd\":\"setuserinfo\",\"enrollid\":" + enrollId + ",\"name\":\"" + name + "\",\"backupnum\":" + backupnum
                                + ",\"admin\":" + admin + ",\"record\":" + record + "}";
                    }

                    using (var transaction = _db.Database.BeginTransaction())
                    {
                        try
                        {
                            _db.machine_command.Add(machineCommand);
                            int rowsAffected = _db.SaveChanges();
                          
                            if (rowsAffected > 0)
                            {
                                transaction.Commit();
                            }
                            else
                            {
                                transaction.Rollback();
                            }
                        }
                        catch (Exception ex)
                        {

                        }
                    }
                }
                semaphore.Release();
            }
        }
        public async Task<ResponseModel> UpdateByPrimaryKey(Person person)
        {
            using (var semaphore = new SemaphoreSlim(1, 1))
            {
                await semaphore.WaitAsync();  // 异步等待
                string sql = @"
            UPDATE person
            SET
              name = @name,
              roll_id = @roll_id
            WHERE id = @id";
                var parameters = new List<NpgsqlParameter>
            {
               new NpgsqlParameter("@roll_id", person.Roll_id),
               new NpgsqlParameter("@name", person.Name ?? (object)DBNull.Value),
              new NpgsqlParameter("@id", person.Id)
            };
                // 执行更新操作
                int i = _db.Database.ExecuteSqlRaw(sql, parameters.ToArray());
                semaphore.Release();
                if (i > 0)
                    return new ResponseModel { Code = 200, Result = "person update success" };

                return new ResponseModel { Code = 0, Result = "person update fail" };
            }
        }
    }
}
