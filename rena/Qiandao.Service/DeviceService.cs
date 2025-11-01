using Qiandao.Model.Entity;
using Qiandao.Model.Request;
using Qiandao.Model.Response;
using AutoMapper;
using Npgsql;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;


namespace Qiandao.Service
{
    /// <summary>
    ///device服务
    /// </summary>
    public class DeviceService : IScope
    {

        private readonly Db _db;
        private readonly IMapper _mapper;
        private readonly ILogger<DeviceService> _logger;
        private readonly object _lockObject = new object();  // 专门的锁对象
        private bool _disposed = false;  // 标记是否已释放资源
        public DeviceService(Db db, IMapper mapper, ILogger<DeviceService> logger)
        {
            _logger = logger;
            _db = db ?? throw new ArgumentNullException(nameof(db));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        }
        public void Dispose()
        { }
        /// <summary>
        /// 添加device
        /// </summary>
        public ResponseModel Adddevice(Adddevice adddevice)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                var device = _mapper.Map<Device>(adddevice);
                _db.device.Add(device);
                int i = _db.SaveChanges();
                if (i > 0)
                {
                    return new ResponseModel() { Code = 200, Result = "device add success" };
                }
                else
                {
                    return new ResponseModel() { Code = 0, Result = "device add fail" };
                }
            }
        }

        /// <summary>
        /// 获取device
        /// </summary>
        public ResponseModel GetdeviceList(int page, int limit)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                var skipCount = (page-1) * limit;
                var query = _db.Database.SqlQueryRaw<Device>(
                    @"
        SELECT *
        FROM device
        ORDER BY id DESC
        LIMIT @Limit OFFSET @SkipCount",
                    new NpgsqlParameter("@SkipCount", skipCount),
                    new NpgsqlParameter("@Limit", limit));
                if (query == null)
                {
                    return new ResponseModel();
                }
                // 执行查询并返回结果
                var queryResult = query.ToList();
                ResponseModel responseModel = new ResponseModel();
                responseModel.Data = new List<Device>();
                foreach (var comment in queryResult)
                {
                    responseModel.Data.Add(new Device
                    {
                        Id = comment.Id,
                        Serial_num = comment.Serial_num,
                        Status = comment.Status
                    });
                }
                responseModel.Code = 200;
                responseModel.Result = "Device";
                return responseModel;
            }
        }

        /// <summary>
        /// 每天签到集合获取
        /// </summary>
        public async Task<ResponseModel> GetdeviceallList(string deviceSn)
        {
            using (var semaphore = new SemaphoreSlim(1, 1))
            {
                await semaphore.WaitAsync();  // 异步等待
                var query = _db.Database.SqlQueryRaw<Device>(@"SELECT * FROM device WHERE serial_num=@deviceSn", new NpgsqlParameter("@deviceSn", deviceSn));
                // 执行查询并返回结果
                if (query == null)
                {
                    return new ResponseModel();
                }
                var queryResult = query.ToList();
                ResponseModel responseModel = new ResponseModel();
                responseModel.Data = new List<Device>();
                foreach (var comment in queryResult)
                {
                    responseModel.Data.Add(new Device
                    {
                        Id = comment.Id,
                        Serial_num = comment.Serial_num,
                        Status = comment.Status
                    });
                }
                semaphore.Release();
                responseModel.Code = 200;
                responseModel.Result = "Device";
                return responseModel;
            }
        }

         /// <summary>
        /// 每天签到集合获取
        /// </summary>
        public async Task<ResponseModel> GetdeviceallList()
        {
            using (var semaphore = new SemaphoreSlim(1, 1))
            {
                await semaphore.WaitAsync();  // 异步等待
                var query = _db.Database.SqlQueryRaw<Device>(@"SELECT * FROM device");
                // 执行查询并返回结果
                if (query == null)
                {
                    return new ResponseModel();
                }
                var queryResult = query.ToList();
                ResponseModel responseModel = new ResponseModel();
                responseModel.Data = new List<Device>();
                foreach (var comment in queryResult)
                {
                    responseModel.Data.Add(new Device
                    {
                        Id = comment.Id,
                        Serial_num = comment.Serial_num,
                        Status = comment.Status
                    });
                }
                semaphore.Release();
                responseModel.Code = 200;
                responseModel.Result = "Device";
                return responseModel;
            }
        }
        public ResponseModel Deletadevice(int deviceID)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                var device = _db.device.Find(deviceID);
                if (device == null)
                    return new ResponseModel() { Code = 0, Result = "device None" };
                _db.device.Remove(device);
                int i = _db.SaveChanges();
                if (i > 0)
                    return new ResponseModel { Code = 200, Result = "device delete success" };

                return new ResponseModel { Code = 0, Result = "adevice delete fail" };
            }
        }
        public ResponseModel addGetOneUserCommand(int enrollId, int backupNum, string serialNum)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                DateTime dt = DateTime.Now;
                string message = "{\"cmd\":\"getuserinfo\",\"enrollid\":" + enrollId + ",\"backupnum\":" + backupNum + "}";
                Machine_command machineCommand = new Machine_command
                {
                    Content = message,
                    Name = "getuserinfo",
                    Status = 0,
                    Send_status = 0,
                    Err_count = 0,
                    Serial = serialNum,
                    Gmt_crate = dt,
                    Gmt_modified = dt
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
                            return new ResponseModel { Code = 200, Result = "add success" };
                        }
                        else
                        {
                            transaction.Rollback();
                            return new ResponseModel { Code = 0, Result = "add fail" };
                        }
                    }
                    catch (Exception ex)
                    {
                        return new ResponseModel { Code = 0, Result = "exception：" + ex.Message };
                    }
                }
            }
        }

        public async Task<ResponseModel> sendWs(string serialNum)
        {
            string message = "{\"cmd\":\"getuserlist\",\"stn\":true}";
            var response =await GetdeviceallList(serialNum);
                // 获取设备列表
                if (response.Data == null)
                {
                    return new ResponseModel { Code = 0, Result = "Data is null" };
                }
                List<Device> deviceList = response.Data;
                DateTime dt = DateTime.Now;
                // 遍历设备列表
                foreach (var device in deviceList)
                {
                    Machine_command machineCommand = new Machine_command
                    {
                        Content = message,
                        Name = "getuserlist",
                        Status = 0,
                        Send_status = 0,
                        Err_count = 0,
                        Serial = device.Serial_num,
                        Gmt_crate = dt,
                        Gmt_modified = dt
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
                            }
                            else
                            {
                                transaction.Rollback();
                            }
                        }
                        catch (Exception ex)
                        {
                            return new ResponseModel { Code = 0, Result = "exception" };
                        }
                    }
                }
            
            return new ResponseModel { Code = 200, Result = "add success" };

        }


        public ResponseModel selectDeviceBySerialNum(string serial_num)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                var query = _db.Database.SqlQueryRaw<Device>(
            @"
            SELECT *
            FROM device
            WHERE serial_num = @serial_num", new NpgsqlParameter("@serial_num", serial_num));

                // 执行查询并返回结果
                var queryResult = query.ToList();
                return new ResponseModel
                {
                    Code = 200,
                    Result = "device list success",
                    Data = queryResult.Count > 0 ? queryResult[0] : null
                };
            }
        }
        public ResponseModel UpdateStatusByPrimaryKey(int id, int status)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                string sql = "UPDATE device SET status = @status WHERE id = @id";
                var parameters = new List<NpgsqlParameter>
            {
                new NpgsqlParameter("@status", status),
                new NpgsqlParameter("@id", id)
            };

                // 执行更新操作
                int i = _db.Database.ExecuteSqlRaw(sql, parameters.ToArray());
                if (i > 0)
                    return new ResponseModel { Code = 200, Result = "device update success" };

                return new ResponseModel { Code = 0, Result = "device update fail" };
            }
        }
        public ResponseModel Insert(string? serial_num, int status)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                string sql = "INSERT INTO device (serial_num, status) VALUES (@serial_num, @status)";
                var parameters = new List<NpgsqlParameter>
            {
                new NpgsqlParameter("@serial_num", serial_num ?? (object)DBNull.Value),
                new NpgsqlParameter("@status", status)
            };

                // 执行更新操作
                int i = _db.Database.ExecuteSqlRaw(sql, parameters.ToArray());
                if (i > 0)
                    return new ResponseModel { Code = 200, Result = "device insert success" };

                return new ResponseModel { Code = 0, Result = "device insert fail" };
            }
        }

    }
}
