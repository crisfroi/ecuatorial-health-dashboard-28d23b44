using Qiandao.Model.Entity;
using Qiandao.Model.Request;
using Qiandao.Model.Response;
using AutoMapper;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;


namespace Qiandao.Service
{
    /// <summary>
    ///enrollinfo服务
    /// </summary>
    public class Machine_commandService : IScope
    {
        private readonly object _lockObject = new object();  // 专门的锁对象
        private bool _disposed = false;  // 标记是否已释放资源

        public void Dispose()
        {
        }
        private readonly Db _db;
        private readonly IMapper _mapper;

        private readonly ILogger<PersonService> _logger;
        public Machine_commandService(Db db, IMapper mapper, ILogger<PersonService> logger)
        {
            _db = db ?? throw new ArgumentNullException(nameof(db));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
            _logger = logger;
        }
        /// <summary>
        /// 添加enrollinfo
        /// </summary>
        public ResponseModel Addmachine_command(Addmachine_command addmachine_command)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                var machine_command = _mapper.Map<Machine_command>(addmachine_command);
                _db.machine_command.Add(machine_command);
                int i = _db.SaveChanges();
                if (i > 0)
                {
                    return new ResponseModel() { Code = 200, Result = "machine_command add successs" };
                }
                else
                {
                    return new ResponseModel() { Code = 0, Result = "machine_command add fail" };
                }
            }
        }

        /// <summary>
        /// 获取machine_command
        /// </summary>
        public ResponseModel Getmachine_commandList()
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                var machine_command = _db.machine_command.OrderByDescending(c => c.Id)
              .Select(p => _mapper.Map<Machine_commandModel>(p))
              .ToList();

                ResponseModel responseModel = new ResponseModel();
                responseModel.Data = new List<Machine_command>();
                foreach (var comment in machine_command)
                {
                    responseModel.Data.Add(new Machine_command
                    {
                        Id = comment.Id,
                        Send_status = comment.Send_status,
                        Serial = comment.Serial,
                        Status = comment.Status,
                        Content = comment.Content,
                        Err_count = comment.Err_count,
                        Gmt_crate = comment.Gmt_crate,
                        Gmt_modified = comment.Gmt_modified,
                        Name = comment.Name,
                        Run_time = comment.Run_time
                    });
                }
                responseModel.Code = 200;
                responseModel.Result = "machine_command list success";
                return responseModel;
            }
        }

        public ResponseModel Deletemachine_command(int machine_commandID)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                var machine_command = _db.machine_command.Find(machine_commandID);
                if (machine_command == null)
                    return new ResponseModel() { Code = 0, Result = "machine_command is null" };
                _db.machine_command.Remove(machine_command);
                int i = _db.SaveChanges();
                if (i > 0)
                    return new ResponseModel { Code = 200, Result = "machine_command delete success" };

                return new ResponseModel { Code = 0, Result = "machine_command delete fail" };
            }
        }
        public async Task<ResponseModel> UpdateCommandStatus(int status, int sendStatus, DateTime runTime, Machine_command machine_command)
        {
            using (var semaphore = new SemaphoreSlim(1, 1))
            {
                await semaphore.WaitAsync();  // 异步等待
                if ((machine_command == null) || (machine_command.Id == 0))
                {
                    return new ResponseModel { Code = 0, Result = "ID isn't null" };
                }

                string sql = "UPDATE machine_command SET status = @status,serial=@Serial, send_status = @sendStatus, run_time = @runTime WHERE id = @id";
                var parameters = new SqlParameter[]
                {
        new SqlParameter("@status", status),
        new SqlParameter("@sendStatus", sendStatus),
        new SqlParameter("@runTime", runTime),
        new SqlParameter("@id", machine_command.Id),
        new SqlParameter("@Serial", machine_command.Serial),

                };

                try
                {
                    int rowsAffected = _db.Database.ExecuteSqlRaw(sql, parameters);
                    semaphore.Release();
                    if (rowsAffected > 0)
                    {
                        return new ResponseModel { Code = 200, Result = "machine_command update success" };
                    }
                    else
                    {
                        return new ResponseModel { Code = 0, Result = "machine_command update fail" };
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Update machine_command exception");
                    return new ResponseModel { Code = 0, Result = "Update machine_command exception" };
                }
            }
        }


        public ResponseModel updateByPrimaryKey(Machine_command machineCommand)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                string sql = @"
            UPDATE machine_command
            SET
              serial = @serial,
              name = @name,
              content = @content,
              status = @status,
              send_status = @sendStatus,
              err_count = @errCount,
              run_time = @runTime,
              gmt_crate = @gmtCrate,
              gmt_modified = @gmtModified
            WHERE id = @id";
                var parameters = new List<SqlParameter>
            {
               new SqlParameter("@serial", machineCommand.Serial),
               new SqlParameter("@name",machineCommand.Name),
               new SqlParameter("@content",machineCommand.Content),
               new SqlParameter("@status",machineCommand.Status),
               new SqlParameter("@sendStatus", machineCommand.Send_status),
              new SqlParameter("@errCount", machineCommand.Err_count),
              new SqlParameter("@runTime", machineCommand.Run_time),
              new SqlParameter("@gmtCrate",machineCommand.Gmt_crate),
              new SqlParameter("@gmtModified",machineCommand.Gmt_modified),
              new SqlParameter("@id", machineCommand.Id)
            };

                // 执行更新操作
                int i = _db.Database.ExecuteSqlRaw(sql, parameters.ToArray());
                if (i > 0)
                    return new ResponseModel { Code = 200, Result = "machine_command update success" };

                return new ResponseModel { Code = 0, Result = "machine_command update fail" };
            }
        }
        public async Task<List<Machine_command>> FindPendingCommand(int sendStatus, string serial)
        {
            using (var semaphore = new SemaphoreSlim(1, 1))
            {
                await semaphore.WaitAsync();  // 异步等待
                string sqlQuery = @"
                SELECT *
                FROM machine_command
                WHERE status = 0
                  AND send_status = @sendStatus
                  AND serial = @serial
                  AND err_count != 3";

                var parameters = new SqlParameter[]
                {
                    new SqlParameter("@sendStatus", sendStatus),
                    new SqlParameter("@serial", serial)
                };
                try
                {
                    var query = _db.Database.SqlQueryRaw<Machine_command>(sqlQuery, parameters);
                    if (query == null)
                    {
                        return null;
                    }
                    var queryResult = query.ToList();
                    semaphore.Release();  // 释放信号量
                    return queryResult;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "select Machine_command is exception");
                    return new List<Machine_command>();  // 返回空列表作为默认值
                }
            }
        }

    }
}
