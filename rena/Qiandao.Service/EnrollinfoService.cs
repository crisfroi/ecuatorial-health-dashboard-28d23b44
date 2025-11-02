using Qiandao.Model.Entity;
using Qiandao.Model.Response;
using System.Text;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Newtonsoft.Json;

namespace Qiandao.Service
{
    /// <summary>
    ///enrollinfo服务
    /// </summary>
    public class EnrollinfoService : IScope
    {
        private readonly object _lockObject = new object();  // 专门的锁对象
        public void Dispose()
        { }
        private readonly Db _db;
        private readonly IMapper _mapper;
        public EnrollinfoService(Db db, IMapper mapper)
        {
            _db = db ?? throw new ArgumentNullException(nameof(db));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        }
        /// <summary>
        /// 添加enrollinfo
        /// </summary>
        public ResponseModel AddEnrollInfo(Enrollinfo addEnrollInfo)
        {
            var response = AddEnrollInfoAsync(addEnrollInfo);
            return response;
        }
        public async Task<ResponseModel> GetPersonallList()
        {
            using (var semaphore = new SemaphoreSlim(1, 1))
            {
                await semaphore.WaitAsync();  // 异步等待
                var query = _db.Database.SqlQueryRaw<Person>(@" SELECT * FROM person");
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
       

        private ResponseModel AddEnrollInfoAsync(Enrollinfo addEnrollInfo)
        {
            var enrollInfo = _mapper.Map<Enrollinfo>(addEnrollInfo);
            _db.enrollinfo.Add(enrollInfo);
            try
            {
                var result = _db.SaveChanges();
                if (result > 0)
                {
                    return new ResponseModel { Code = 200, Result = "EnrollInfo add success" };
                }
                else
                {
                    return new ResponseModel { Code = 0, Result = "EnrollInfo add fail" };
                }
            }
            catch (Exception ex)
            {
                // 记录异常日志
                return new ResponseModel { Code = 500, Result = "Save EnrollInfo exception" };
            }
        }
        //查询用户的脸部信息
        public ResponseModel SelectEnrollById(long? id)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                var enrollInfoSingle = _db.enrollinfo
          .Where(p => p.Enroll_id == id && p.Backupnum == 50)
          .OrderByDescending(c => c.Id)
          .FirstOrDefault(); // 注意这里的变化

                return new ResponseModel
                {
                    Code = 200,
                    Result = "enrollinfo success",
                    Data = enrollInfoSingle
                };
            }
        }

        public async Task<ResponseModel> SelectEnrollallByIdAsync(long? enrollId)
        {
            var query = _db.Database.SqlQueryRaw<Enrollinfo>(
                @"SELECT id, enroll_id, backupnum, imagepath, signatures 
                FROM enrollinfo 
                WHERE enroll_id = @enrollId",
                new NpgsqlParameter("@enrollId", enrollId)
            );

            if (query == null)
            {
                return new ResponseModel();
            }

            // 执行查询并返回结果
            var queryResult = await query.ToListAsync();

            ResponseModel responseModel = new ResponseModel
            {
                Data = new List<Enrollinfo>(),
                Code = 200,
                Result = "Device success"
            };

            foreach (var comment in queryResult)
            {
                responseModel.Data.Add(new Enrollinfo
                {
                    Id = comment.Id,
                    Enroll_id = comment.Enroll_id,
                    ImagePath = comment.ImagePath,
                    Signatures = comment.Signatures,
                    Backupnum = comment.Backupnum
                });
            }

            responseModel.Data.Reverse();

            return responseModel;

        }


        /// <summary>
        /// 获取enrollinfo
        /// </summary>
        public async Task<ResponseModel> GetenrollinfoList()
        {
            using (var semaphore = new SemaphoreSlim(1, 1))
            {
                await semaphore.WaitAsync();  // 异步等待
                var query = _db.Database.SqlQueryRaw<Enrollinfo>(
               @"SELECT id, enroll_id, backupnum, imagepath, signatures 
                FROM enrollinfo ");

                if (query == null)
                {
                    return new ResponseModel();
                }

                // 执行查询并返回结果
                var enrollinfo = query.ToList();
                if (enrollinfo == null)
                {
                    return new ResponseModel();
                }
                ResponseModel responseModel = new ResponseModel();
                responseModel.Data = new List<Enrollinfo>();
                foreach (var comment in enrollinfo)
                {
                    responseModel.Data.Add(new Enrollinfo
                    {
                        Id = comment.Id,
                        Enroll_id = comment.Enroll_id,
                        ImagePath = comment.ImagePath,
                        Signatures = comment.Signatures,
                        Backupnum = comment.Backupnum
                    });
                }
                semaphore.Release();
                responseModel.Code = 200;
                responseModel.Result = "enrollinfo list success";
                return responseModel;

            }
        }

        public ResponseModel DeleteEnrollInfo(int enrollInfoID)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                // 查找指定 ID 的 enrollinfo
                var enrollInfo = _db.enrollinfo.Find(enrollInfoID);

                // 检查 enrollinfo 是否存在
                if (enrollInfo == null)
                {
                    return new ResponseModel { Code = 0, Result = "EnrollInfo is null" };
                }

                try
                {
                    // 移除 enrollinfo
                    _db.enrollinfo.Remove(enrollInfo);

                    // 保存更改
                    int rowsAffected = _db.SaveChanges();

                    // 检查是否有数据被影响
                    if (rowsAffected > 0)
                    {
                        return new ResponseModel { Code = 200, Result = "EnrollInfo delete success" };
                    }
                    else
                    {
                        return new ResponseModel { Code = 0, Result = "EnrollInfo delete fail" };
                    }
                }
                catch (Exception ex)
                {
                    // 异常处理
                    return new ResponseModel { Code = 500, Result = $"delete is exception: {ex.Message}" };
                }
            }
        }
      
        public async Task<List<UserInfo>> usersToSendDevice(ResponseModel pm)
        {
            using (var semaphore = new SemaphoreSlim(1, 1))
            {
                await semaphore.WaitAsync();  // 异步等待
                ResponseModel em =await GetenrollinfoList();
                List<UserInfo> userInfos = new List<UserInfo>();
                if (pm.Data != null || em.Data != null)
                {
                    List<Person> personList = pm.Data;
                    List<Enrollinfo> eninfolist = em.Data;
                    foreach (var person in personList)
                    {
                        foreach (var eninfo in eninfolist)
                        {
                            if (person.Id == eninfo.Enroll_id)
                            {
                                UserInfo ui = new UserInfo
                                {
                                    Admin = person.Roll_id,
                                    Backupnum = eninfo.Backupnum,
                                    EnrollId = person.Id,
                                    Name = person.Name,
                                    Record = eninfo.Signatures
                                };
                                userInfos.Add(ui);
                            }
                        }
                    }
                }
                semaphore.Release();
                return userInfos;
            }
        }
        public ResponseModel setUsernameToDevice(string deviceSn, List<Person> persons)
        {
            lock (_lockObject)  // 确保同一时间只有一个线��访问
            {
                DateTime dt = DateTime.Now;
                StringBuilder sb = new StringBuilder();
                sb.Append("{\"cmd\":\"setusername\",\"count\":" + persons.Count() + ",\"record\":[");
                for (int j = 0; j < persons.Count(); j++)
                {
                    if (j == persons.Count() - 1 || persons.Count() == 1)
                    {
                        sb.Append("{\"enrollid\":" + persons[j].Id + ",\"name\":\"" + persons[j].Name + "\"}");
                    }
                    else
                    {
                        sb.Append("{\"enrollid\":" + persons[j].Id + ",\"name\":\"" + persons[j].Name + "\"},");
                    }
                }
                sb.Append("]}");

                Machine_command machineCommand = new Machine_command
                {
                    Name = "setusername",
                    Status = 0,
                    Send_status = 0,
                    Err_count = 0,
                    Serial = deviceSn,
                    Gmt_crate = dt,
                    Gmt_modified = dt,
                    Content = sb.ToString()
                };
                using (var transaction = _db.Database.BeginTransaction())
                {
                    try
                    {
                        _db.machine_command.Add(machineCommand);
                        int rowsAffected = _db.SaveChanges();

                        if (rowsAffected > 0)
                        {
                            transaction.Commit();
                            return new ResponseModel { Code = 200, Result = "success" };
                        }
                        else
                        {
                            transaction.Rollback();
                            return new ResponseModel { Code = 0, Result = "fail" };
                        }
                    }
                    catch (Exception)
                    {

                        return new ResponseModel { Code = 0, Result = "exception" };
                    }
                }
            }
        }

        public ResponseModel initSystem(string deviceSn)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                DateTime dt = DateTime.Now;
                string message = "{\"cmd\":\"initsys\"}";
                Machine_command machineCommand = new Machine_command
                {
                    Name = "initsys",
                    Status = 0,
                    Send_status = 0,
                    Err_count = 0,
                    Serial = deviceSn,
                    Gmt_crate = dt,
                    Gmt_modified = dt,
                    Content = message
                };
                using (var transaction = _db.Database.BeginTransaction())
                {
                    try
                    {
                        _db.machine_command.Add(machineCommand);
                        int rowsAffected = _db.SaveChanges();

                        if (rowsAffected > 0)
                        {
                            transaction.Commit();
                            return new ResponseModel { Code = 200, Result = "success" };
                        }
                        else
                        {
                            transaction.Rollback();
                            return new ResponseModel { Code = 0, Result = "fail" };
                        }
                    }
                    catch (Exception)
                    {

                        return new ResponseModel { Code = 0, Result = "exception" };
                    }
                }
            }
        }
        public ResponseModel SetLockGroup(LockGroup lockGroup, List<Device> deviceList)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                // 使用 Newtonsoft.Json 库生成 JSON 字符串
                var lockGroupJson = JsonConvert.SerializeObject(new
                {
                    cmd = "setdevlock",
                    lockgroup = new List<dynamic>
        {
            new { group = lockGroup.group1 ?? "0" },
            new { group = lockGroup.group2 ?? "0" },
            new { group = lockGroup.group3 ?? "0" },
            new { group = lockGroup.group4 ?? "0" },
            new { group = lockGroup.group5 ?? "0" }
        }
                });

                DateTime dt = DateTime.Now;
                string message = lockGroupJson;
                using (var transaction = _db.Database.BeginTransaction())
                {
                    try
                    {
                        foreach (Device device in deviceList)
                        {
                            var machineCommand = new Machine_command
                            {
                                Name = "setdevlock",
                                Status = 0,
                                Send_status = 0,
                                Err_count = 0,
                                Serial = device.Serial_num,
                                Gmt_crate = dt,
                                Gmt_modified = dt,
                                Content = message
                            };

                            _db.machine_command.Add(machineCommand);
                        }

                        int rowsAffected = _db.SaveChanges();

                        if (rowsAffected > 0)
                        {
                            transaction.Commit();
                            return new ResponseModel { Code = 200, Result = "success" };
                        }
                        else
                        {
                            transaction.Rollback();
                            return new ResponseModel { Code = 0, Result = "fail" };
                        }
                    }
                    catch (Exception)
                    {

                        return new ResponseModel { Code = 0, Result = "exception" };
                    }
                }
            }
        }
        public ResponseModel SetUserLock(UserLock userLock, List<Device> deviceList)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                StringBuilder sb = new StringBuilder();
                sb.Append("{\"cmd\":\"setuserlock\",\"count\":1,\"record\":[{");
                sb.Append("\"enrollid\":" + userLock.enrollId + ",");
                sb.Append("\"weekzone\":" + userLock.weekZone + ",");
                sb.Append("\"group\":" + userLock.group + ",");
                sb.Append("\"starttime\":\"" + userLock.starttime + " 00:00:00" + "\",");
                sb.Append("\"endtime\":\"" + userLock.endtime + " 00:00:00" + "\"}]}");
                string message = sb.ToString();
                DateTime dt = DateTime.Now;
                using (var transaction = _db.Database.BeginTransaction())
                {
                    try
                    {
                        foreach (Device device in deviceList)
                        {
                            var machineCommand = new Machine_command
                            {
                                Name = "setuserlock",
                                Status = 0,
                                Send_status = 0,
                                Err_count = 0,
                                Serial = device.Serial_num,
                                Gmt_crate = dt,
                                Gmt_modified = dt,
                                Content = message
                            };

                            _db.machine_command.Add(machineCommand);
                        }

                        int rowsAffected = _db.SaveChanges();

                        if (rowsAffected > 0)
                        {
                            transaction.Commit();
                            return new ResponseModel { Code = 200, Result = "successs" };
                        }
                        else
                        {
                            transaction.Rollback();
                            return new ResponseModel { Code = 0, Result = "fail" };
                        }
                    }
                    catch (Exception)
                    {

                        return new ResponseModel { Code = 0, Result = "exception" };
                    }
                }
            }

        }

        public ResponseModel GetDeviceInfo(string deviceSn)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                string message = "{\"cmd\":\"getdevinfo\"}";
                DateTime dt = DateTime.Now;
                using (var transaction = _db.Database.BeginTransaction())
                {
                    try
                    {
                        var machineCommand = new Machine_command
                        {
                            Name = "getdevinfo",
                            Status = 0,
                            Send_status = 0,
                            Err_count = 0,
                            Serial = deviceSn,
                            Gmt_crate = dt,
                            Gmt_modified = dt,
                            Content = message
                        };

                        _db.machine_command.Add(machineCommand);
                        int rowsAffected = _db.SaveChanges();
                        if (rowsAffected > 0)
                        {
                            transaction.Commit();
                            return new ResponseModel { Code = 200, Result = "success" };
                        }
                        else
                        {
                            transaction.Rollback();
                            return new ResponseModel { Code = 0, Result = "fail" };
                        }
                    }
                    catch (Exception)
                    {

                        return new ResponseModel { Code = 0, Result = "exception" };
                    }
                }
            }
        }


        public ResponseModel OpenDoor(int doorNum, string deviceSn)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                string message = "{\"cmd\":\"opendoor\"" + ",\"doornum\":" + doorNum + "}";
                DateTime dt = DateTime.Now;
                using (var transaction = _db.Database.BeginTransaction())
                {
                    try
                    {
                        var machineCommand = new Machine_command
                        {
                            Name = "opendoor",
                            Status = 0,
                            Send_status = 0,
                            Err_count = 0,
                            Serial = deviceSn,
                            Gmt_crate = dt,
                            Gmt_modified = dt,
                            Content = message
                        };

                        _db.machine_command.Add(machineCommand);
                        int rowsAffected = _db.SaveChanges();
                        if (rowsAffected > 0)
                        {
                            transaction.Commit();
                            return new ResponseModel { Code = 200, Result = "success" };
                        }
                        else
                        {
                            transaction.Rollback();
                            return new ResponseModel { Code = 0, Result = "fail" };
                        }
                    }
                    catch (Exception)
                    {

                        return new ResponseModel { Code = 0, Result = "exception" };
                    }
                }
            }
        }
        public ResponseModel getDevLock(string deviceSn)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                string message = "{\"cmd\":\"getdevlock\"}";
                DateTime dt = DateTime.Now;
                using (var transaction = _db.Database.BeginTransaction())
                {
                    try
                    {
                        var machineCommand = new Machine_command
                        {
                            Name = "getdevlock",
                            Status = 0,
                            Send_status = 0,
                            Err_count = 0,
                            Serial = deviceSn,
                            Gmt_crate = dt,
                            Gmt_modified = dt,
                            Content = message
                        };

                        _db.machine_command.Add(machineCommand);
                        int rowsAffected = _db.SaveChanges();
                        if (rowsAffected > 0)
                        {
                            transaction.Commit();
                            return new ResponseModel { Code = 200, Result = "success" };
                        }
                        else
                        {
                            transaction.Rollback();
                            return new ResponseModel { Code = 0, Result = "fail" };
                        }
                    }
                    catch (Exception)
                    {

                        return new ResponseModel { Code = 0, Result = "exception" };
                    }
                }
            }
        }
        public ResponseModel getUSerLock(int enrollId, string deviceSn)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                string message = "{\"cmd\":\"getuserlock\",\"enrollid\":" + enrollId + "}";
                DateTime dt = DateTime.Now;
                using (var transaction = _db.Database.BeginTransaction())
                {
                    try
                    {
                        var machineCommand = new Machine_command
                        {
                            Name = "getuserlock",
                            Status = 0,
                            Send_status = 0,
                            Err_count = 0,
                            Serial = deviceSn,
                            Gmt_crate = dt,
                            Gmt_modified = dt,
                            Content = message
                        };

                        _db.machine_command.Add(machineCommand);
                        int rowsAffected = _db.SaveChanges();
                        if (rowsAffected > 0)
                        {
                            transaction.Commit();
                            return new ResponseModel { Code = 200, Result = "success" };
                        }
                        else
                        {
                            transaction.Rollback();
                            return new ResponseModel { Code = 0, Result = "fail" };
                        }
                    }
                    catch (Exception)
                    {

                        return new ResponseModel { Code = 0, Result = "exception" };
                    }
                }
            }
        }
        public ResponseModel cleanAdmin(string deviceSn)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                string message = "{\"cmd\":\"cleanadmin\"}";
                DateTime dt = DateTime.Now;
                using (var transaction = _db.Database.BeginTransaction())
                {
                    try
                    {
                        var machineCommand = new Machine_command
                        {
                            Name = "cleanadmin",
                            Status = 0,
                            Send_status = 0,
                            Err_count = 0,
                            Serial = deviceSn,
                            Gmt_crate = dt,
                            Gmt_modified = dt,
                            Content = message
                        };

                        _db.machine_command.Add(machineCommand);
                        int rowsAffected = _db.SaveChanges();
                        if (rowsAffected > 0)
                        {
                            transaction.Commit();
                            return new ResponseModel { Code = 200, Result = "success" };
                        }
                        else
                        {
                            transaction.Rollback();
                            return new ResponseModel { Code = 0, Result = "fail" };
                        }
                    }
                    catch (Exception)
                    {

                        return new ResponseModel { Code = 0, Result = "exception" };
                    }
                }
            }
        }

        public ResponseModel getNewLog(string deviceSn)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                string message = "{\"cmd\":\"getnewlog\",\"stn\":true}";
                DateTime dt = DateTime.Now;
                using (var transaction = _db.Database.BeginTransaction())
                {
                    try
                    {
                        var machineCommand = new Machine_command
                        {
                            Name = "getnewlog",
                            Status = 0,
                            Send_status = 0,
                            Err_count = 0,
                            Serial = deviceSn,
                            Gmt_crate = dt,
                            Gmt_modified = dt,
                            Content = message
                        };

                        _db.machine_command.Add(machineCommand);
                        int rowsAffected = _db.SaveChanges();
                        if (rowsAffected > 0)
                        {
                            transaction.Commit();
                            return new ResponseModel { Code = 200, Result = "success" };
                        }
                        else
                        {
                            transaction.Rollback();
                            return new ResponseModel { Code = 0, Result = "fail" };
                        }
                    }
                    catch (Exception)
                    {

                        return new ResponseModel { Code = 0, Result = "exception" };
                    }
                }
            }
        }
        public ResponseModel collectLog(string deviceSn)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                string message = "{\"cmd\":\"getalllog\",\"stn\":true}";
                DateTime dt = DateTime.Now;
                using (var transaction = _db.Database.BeginTransaction())
                {
                    try
                    {
                        var machineCommand = new Machine_command
                        {
                            Name = "getalllog",
                            Status = 0,
                            Send_status = 0,
                            Err_count = 0,
                            Serial = deviceSn,
                            Gmt_crate = dt,
                            Gmt_modified = dt,
                            Content = message
                        };
                        _db.machine_command.Add(machineCommand);
                        int rowsAffected = _db.SaveChanges();
                        if (rowsAffected > 0)
                        {
                            transaction.Commit();
                            return new ResponseModel { Code = 200, Result = "success" };
                        }
                        else
                        {
                            transaction.Rollback();
                            return new ResponseModel { Code = 0, Result = "fail" };
                        }
                    }
                    catch (Exception)
                    {

                        return new ResponseModel { Code = 0, Result = "exception" };
                    }
                }
            }
        }


        public Enrollinfo SelectByBackupnum(long enroll_id, int backupnum)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                try
                {
                    var query = _db.Database.SqlQueryRaw<Enrollinfo>(
                        @"
            SELECT id, enroll_id, backupnum, imagepath, signatures
            FROM enrollinfo
            WHERE enroll_id = @enroll_id AND backupnum = @backupnum",
                        new NpgsqlParameter("@enroll_id", enroll_id),
                        new NpgsqlParameter("@backupnum", backupnum));

                    var resultList = query.ToList();

                    if (resultList.Any())
                    {
                        return resultList.First();
                    }
                    else
                    {
                        return null;
                    }
                }
                catch (Exception ex)
                {
                    // 记录异常信息
                    Console.WriteLine($"Error: {ex.Message}");
                    return null;
                }
            }
        }
        public async Task<ResponseModel> Insert(Enrollinfo enrollinfo)
        {
            using (var semaphore = new SemaphoreSlim(1, 1))
            {
                await semaphore.WaitAsync();  // 异步等待
                // 参数验证
                if (enrollinfo == null)
                {
                    return new ResponseModel { Code = 0, Result = "enrollinfo对象不能为空" };
                }

                string sql = "INSERT INTO enrollinfo (enroll_id, backupnum, imagepath, signatures) VALUES (@enroll_id, @backupnum, @imagepath, @signatures)";

                // 创建参数集合
                var parameters = new List<NpgsqlParameter>
    {
        new NpgsqlParameter("@enroll_id", enrollinfo.Enroll_id),
        new NpgsqlParameter("@backupnum", enrollinfo.Backupnum),
        new NpgsqlParameter("@imagepath", enrollinfo.ImagePath ?? (object)DBNull.Value),
        new NpgsqlParameter("@signatures", enrollinfo.Signatures ?? (object)DBNull.Value)
    };

                try
                {
                    int rowsAffected = _db.Database.ExecuteSqlRaw(sql, parameters);
                    semaphore.Release();  // 释放信号量
                    if (rowsAffected > 0)
                    {
                        return new ResponseModel { Code = 200, Result = "enrollinfo插入成功" };
                    }
                    else
                    {
                        return new ResponseModel { Code = 0, Result = "enrollinfo插入失败" };
                    }
                }
                catch (Exception ex)
                {
                    // 记录异常信息
                    Console.WriteLine($"Error: {ex.Message}");
                    return new ResponseModel { Code = 0, Result = "插入时发生异常" };
                }
            }
        }

        public async Task<ResponseModel> updateByPrimaryKeySelective(Enrollinfo enrollinfo)
        {
            using (var semaphore = new SemaphoreSlim(1, 1))
            {
                await semaphore.WaitAsync();  // 异步等待
                string sql = @"
            UPDATE enrollinfo
            SET
              enroll_id = @enroll_id,
              backupnum = @backupnum,
             imagepath = @imagepath,
            signatures = @signatures
            WHERE id = @id";
                var parameters = new List<NpgsqlParameter>
            {
               new NpgsqlParameter("@enroll_id", enrollinfo.Enroll_id),
               new NpgsqlParameter("@backupnum", enrollinfo.Backupnum),
               new NpgsqlParameter("@imagepath", enrollinfo.ImagePath ?? (object)DBNull.Value),
              new NpgsqlParameter("@signatures", enrollinfo.Signatures ?? (object)DBNull.Value),
              new NpgsqlParameter("@id", enrollinfo.Id)
            };

                // 执行更新操作
                int i = _db.Database.ExecuteSqlRaw(sql, parameters.ToArray());
                semaphore.Release();  // 释放信号量
                if (i > 0)
                    return new ResponseModel { Code = 200, Result = "enrollinfo更新成功" };

                return new ResponseModel { Code = 0, Result = "enrollinfo更新失败" };
            }
        
        }
    }
}
