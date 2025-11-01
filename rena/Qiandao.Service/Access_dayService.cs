using Qiandao.Model.Entity;
using Qiandao.Model.Request;
using Qiandao.Model.Response;
using System.Text;
using AutoMapper;
using Microsoft.EntityFrameworkCore;


namespace Qiandao.Service
{
    /// <summary>
    /// access_day服务
    /// </summary>
    public class Access_dayService : IScope
    {
        private readonly object _lockObject = new object();  // 专门的锁对象
        public void Dispose()
        {
        }
        private readonly Db _db;
        private readonly IMapper _mapper;
        public Access_dayService(Db db, IMapper mapper)
        {
            _db = db ?? throw new ArgumentNullException(nameof(db));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        }
        /// <summary>
        /// 添加每天签到
        /// </summary>
        public ResponseModel Addaccess_day(Addaccess_day addaccess_day)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                var access_day = _mapper.Map<Access_day>(addaccess_day);
                access_day.Id = addaccess_day.Id;
                _db.access_day.Add(access_day);
                int i = _db.SaveChanges();
                if (i > 0)
                {
                    return new ResponseModel() { Code = 200, Result = "Success" };
                }
                else
                {
                    return new ResponseModel() { Code = 0, Result = "Fail" };
                }
            }
        }
        /// <summary>
        /// 添加每天签到
        /// </summary>
        public ResponseModel UpdateAddaccess_day(Addaccess_day addaccess_day)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                var access_day = _db.access_day.Find(addaccess_day.Id);
                if (access_day == null)
                {
                    return new ResponseModel() { Code = 0, Result = "None object" };
                }
                // 使用 AutoMapper 更新实体属性
                _mapper.Map(addaccess_day, access_day);
                // 设置实体的状态为 Modified
                _db.Entry(access_day).State = EntityState.Modified;
                int i = _db.SaveChanges();
                if (i > 0)
                {
                    return new ResponseModel() { Code = 200, Result = "Success" };
                }
                else
                {
                    return new ResponseModel() { Code = 0, Result = "Fail" };
                }
            }
        }
        /// <summary>
        /// 每天签到集合获取
        /// </summary>
        public async Task<ResponseModel> Getaccess_dayList()
        {
            using (var semaphore = new SemaphoreSlim(1, 1))
            {
                await semaphore.WaitAsync();  // 异步等待
                var query = _db.Database.SqlQueryRaw<Access_day>(@"SELECT * FROM access_day");
                // 执行查询并返回结果
                var queryResult = query.ToList();
                ResponseModel responseModel = new ResponseModel();
                responseModel.Data = new List<Access_day>();
                foreach (var comment in queryResult)
                {
                    responseModel.Data.Add(new Access_day
                    {
                        Id = comment.Id,
                        Name = comment.Name,
                        start_time1 = comment.start_time1,
                        end_time1 = comment.end_time1,
                        start_time2 = comment.start_time2,
                        end_time2 = comment.end_time2,
                        start_time3 = comment.start_time3,
                        end_time3 = comment.end_time3,
                        start_time4 = comment.start_time4,
                        end_time4 = comment.end_time4,
                        start_time5 = comment.start_time5,
                        end_time5 = comment.end_time5,
                        Serial = comment.Serial
                    });
                }
                semaphore.Release();
                responseModel.Code = 200;
                responseModel.Result = "access_day Success";
                return responseModel;
            }
        }

        public ResponseModel Deletaaccess_day(int access_dayID)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                var access_day = _db.access_day.Find(access_dayID);
                if (access_day == null)
                    return new ResponseModel() { Code = 0, Result = "access_day is null" };
                _db.access_day.Remove(access_day);
                int i = _db.SaveChanges();
                if (i > 0)
                    return new ResponseModel { Code = 200, Result = "access_day delete success" };

                return new ResponseModel { Code = 0, Result = "access_day delete fail" };
            }
        }
        public async Task<ResponseModel> SetAccessDay(List<Device> deviceList)
        {
            StringBuilder sb = new StringBuilder();
            ResponseModel rm = await Getaccess_dayList();
            if (rm.Data != null)
            {
                List<Access_day> accessDays = rm.Data;
                List<Access_day> accessDaysTemp = new List<Access_day>();
                DateTime dt = DateTime.Now;
                // 构建完整的 accessDaysTemp 列表
                if (accessDays.Count < 8)
                {
                    for (int i = 0; i < 8; i++)
                    {
                        Access_day ad = ynfun(accessDays, i + 1);
                        if (ad!=null)
                        {
                            Access_day accessDay1 = new Access_day
                            {
                                Id = i + 1,
                                start_time1 = ad.start_time1,
                                end_time1 = ad.end_time1,
                                start_time2 = ad.start_time2,
                                end_time2 = ad.end_time2,
                                start_time3 = ad.start_time3,
                                end_time3 = ad.end_time3,
                                start_time4 = ad.start_time4,
                                end_time4 = ad.end_time4,
                                start_time5 = ad.start_time5,
                                end_time5 = ad.end_time5,
                            };
                            accessDaysTemp.Add(accessDay1);
                        }
                        else
                        {
                            Access_day accessDay1 = new Access_day
                            {
                                Id = i + 1,
                                start_time1 = "00:00",
                                end_time1 = "00:00",
                                start_time2 = "00:00",
                                end_time2 = "00:00",
                                start_time3 = "00:00",
                                end_time3 = "00:00",
                                start_time4 = "00:00",
                                end_time4 = "00:00",
                                start_time5 = "00:00",
                                end_time5 = "00:00"
                            };
                            accessDaysTemp.Add(accessDay1);
                        }
                    }
                }
                else
                {
                    return new ResponseModel { Code = 0, Result = "fail" };
                }

                // 构建 JSON 字符串
                sb.Append("{\"cmd\":\"setdevlock\",\"dayzone\":[");
                for (int i = 0; i < accessDaysTemp.Count; i++)
                {
                    sb.Append("{\"day\":[");
                    sb.Append("{\"section\":\"" + accessDaysTemp[i].start_time1 + "~" + accessDaysTemp[i].end_time1 + "\"},");
                    sb.Append("{\"section\":\"" + accessDaysTemp[i].start_time2 + "~" + accessDaysTemp[i].end_time2 + "\"},");
                    sb.Append("{\"section\":\"" + accessDaysTemp[i].start_time3 + "~" + accessDaysTemp[i].end_time3 + "\"},");
                    sb.Append("{\"section\":\"" + accessDaysTemp[i].start_time4 + "~" + accessDaysTemp[i].end_time4 + "\"},");
                    sb.Append("{\"section\":\"" + accessDaysTemp[i].start_time5 + "~" + accessDaysTemp[i].end_time5 + "\"}");
                    sb.Append("]}");
                    if (i != 7)
                    {
                        sb.Append(",");
                    }
                }
                sb.Append("]}");
                string message = sb.ToString();
                foreach (Device device in deviceList)
                {
                    Machine_command machineCommand = new Machine_command
                    {
                        Content = message,
                        Name = "setdevlock",
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
                                return new ResponseModel { Code = 200, Result = "Success" };
                            }
                            else
                            {
                                transaction.Rollback();
                                return new ResponseModel { Code = 0, Result = "Fail" };
                            }
                        }
                        catch (Exception)
                        {
                            transaction.Rollback();
                            return new ResponseModel { Code = 0, Result = "error" };
                        }
                    }
                }
            }
            else
            {
                return new ResponseModel { Code = 0, Result = "error" };
            }
            // 如果所有设备都处理完毕，返回成功
            return new ResponseModel { Code = 200, Result = "success" };
        }

        public ResponseModel selectByPrimaryKey(int? id)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                var accessDay = _db.access_day.FirstOrDefault(a => a.Id == id);
                if (accessDay == null)
                {
                    return new ResponseModel { Code = 0, Result = "Can not fing ID" };
                }

                return new ResponseModel
                {
                    Code = 200,
                    Result = "access_day success",
                    Data = accessDay
                };
            }
        }
        public Access_day ynfun(List<Access_day> accessDaysTemp, int i)
        {
            Access_day yn = null;
            for (int j = 0; j < accessDaysTemp.Count; j++)
            {
                if (accessDaysTemp[j].Id == i)
                {
                    yn = accessDaysTemp[j];
                }
            }
            return yn;
        }
    }
}
