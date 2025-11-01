using Qiandao.Model.Entity;
using Qiandao.Model.Request;
using Qiandao.Model.Response;
using System.Text;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace Qiandao.Service
{
    /// <summary>
    ///access_week服务
    /// </summary>
    public class Access_weekService : IScope
    {
        private readonly object _lockObject = new object();  // 专门的锁对象
        private bool _disposed = false;  // 标记是否已释放资源
        public void Dispose()
        { }
        private readonly Db _db;
        private readonly IMapper _mapper;
        public Access_weekService(Db db, IMapper mapper)
        {
            _db = db ?? throw new ArgumentNullException(nameof(db));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        }
        /// <summary>
        /// 添加access_week
        /// </summary>
        public ResponseModel Addaccess_week(Addaccess_week addaccess_week)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                var access_week = _mapper.Map<Access_week>(addaccess_week);
                access_week.Id = addaccess_week.Id;
                _db.access_week.Add(access_week);
                int i = _db.SaveChanges();
                if (i > 0)
                {

                    return new ResponseModel() { Code = 200, Result = "access_week add success" };
                }
                else
                {
                    return new ResponseModel() { Code = 0, Result = "access_week add fail" };
                }
            }
        }
        /// <summary>
        /// 更新access_week
        /// </summary>
        public ResponseModel updateByPrimaryKey(Addaccess_week addaccess_week)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                var accessWeek = _db.access_week.Find(addaccess_week.Id);

                if (accessWeek == null)
                {
                    return new ResponseModel() { Code = 0, Result = "None object" };
                }

                _mapper.Map(addaccess_week, accessWeek);
                // 手动设置 ID

                // 设置实体的状态为 Modified
                _db.Entry(accessWeek).State = EntityState.Modified;
                int i = _db.SaveChanges();
                if (i > 0)
                {
                    return new ResponseModel() { Code = 200, Result = "access_week select success" };
                }
                else
                {
                    return new ResponseModel() { Code = 0, Result = "access_week select fail" };
                }
            }
        }

        /// <summary>
        /// 每天签到集合获取
        /// </summary>
        public async Task<ResponseModel> Getaccess_weekList()
        {
            using (var semaphore = new SemaphoreSlim(1, 1))
            {
                await semaphore.WaitAsync();  // 异步等待
                var query = _db.Database.SqlQueryRaw<Access_week>(@"SELECT * FROM access_week");
                // 执行查询并返回结果
                var queryResult = query.ToList();
                ResponseModel responseModel = new ResponseModel();
                responseModel.Data = new List<Access_week>();
                foreach (var comment in queryResult)
                {
                    responseModel.Data.Add(new Access_week
                    {
                        Id = comment.Id,
                        Name = comment.Name,
                        Monday = comment.Monday,
                        Thursday = comment.Thursday,
                        Saturday = comment.Saturday,
                        Tuesday = comment.Tuesday,
                        Friday = comment.Friday,
                        Sunday = comment.Sunday,
                        Wednesday = comment.Wednesday,
                        Serial = comment.Serial
                    });
                }
                semaphore.Release();
                responseModel.Code = 200;
                responseModel.Result = "Access_week list success";
                return responseModel;
            }
        }

        public ResponseModel DeletaBanner(int access_weekID)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                var access_week = _db.access_week.Find(access_weekID);
                if (access_week == null)
                    return new ResponseModel() { Code = 0, Result = "access_week is none" };
                _db.access_week.Remove(access_week);
                int i = _db.SaveChanges();
                if (i > 0)
                    return new ResponseModel { Code = 200, Result = "access_week delete success" };

                return new ResponseModel { Code = 0, Result = "access_week delete fail" };
            }
        }
        public ResponseModel selectByPrimaryKey(int? id)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                var accessWeek = _db.access_week.Find(id);
                if (accessWeek == null)
                {
                    return new ResponseModel { Code = 0, Result = "Can not fing ID" };
                }
                return new ResponseModel
                {
                    Code = 200,
                    Result = "access_week success",
                    Data = accessWeek
                };

            }
        }
        public async Task<ResponseModel> SetAccessWeek(List<Device> deviceList)
        {
            StringBuilder sb = new StringBuilder();
            sb.Append("{\"cmd\":\"setdevlock\",\"weekzone\":[");
            ResponseModel rm = await Getaccess_weekList();
            if (rm.Data == null)
            {
                return new ResponseModel
                {
                    Code = 0,
                    Result = "access_weekList select fail",
                };
            }
            List<Access_week> accessWeeks = rm.Data;
            DateTime dt = DateTime.Now;
            List<Access_week> accessWeeksTemp = new List<Access_week>();
            if (accessWeeks.Count() == 8)
            {
                for (int i = 0; i < accessWeeks.Count(); i++)
                {
                    sb.Append("{\"week\":[");
                    sb.Append("{\"day\":" + accessWeeks[i].Saturday + "},");
                    sb.Append("{\"day\":" + accessWeeks[i].Monday + "},");
                    sb.Append("{\"day\":" + accessWeeks[i].Tuesday + "},");
                    sb.Append("{\"day\":" + accessWeeks[i].Wednesday + "},");
                    sb.Append("{\"day\":" + accessWeeks[i].Thursday + "},");
                    sb.Append("{\"day\":" + accessWeeks[i].Friday + "},");
                    sb.Append("{\"day\":" + accessWeeks[i].Saturday + "}");
                    if (i != 7)
                    {
                        sb.Append("]},");
                    }
                    else
                    {
                        sb.Append("]}");
                    }
                }
            }
            else if (accessWeeks.Count() < 8)
            {
                for (int i = 0; i < 8; i++)
                {
                    Access_week aw = ynfun(accessWeeks, i + 1);
                    if (aw!=null)
                    {
                        Access_week accessWeek = new Access_week
                        {
                            Id = i + 1,
                            Monday = aw.Monday,
                            Tuesday = aw.Tuesday,
                            Wednesday = aw.Wednesday,
                            Thursday = aw.Thursday,
                            Friday = aw.Friday,
                            Saturday = aw.Saturday,
                            Sunday = aw.Sunday,
                        };
                        accessWeeksTemp.Add(accessWeek);
                    }
                    else
                    {
                        Access_week accessWeek = new Access_week
                        {
                            Id = i + 1,
                            Monday = 0,
                            Tuesday = 0,
                            Wednesday = 0,
                            Thursday = 0,
                            Friday = 0,
                            Saturday = 0,
                            Sunday = 0
                        };
                        accessWeeksTemp.Add(accessWeek);
                    }
                }
                for (int i = 0; i < accessWeeksTemp.Count(); i++)
                {
                    sb.Append("{\"week\":[");
                    sb.Append("{\"day\":" + accessWeeksTemp[i].Sunday + "},");
                    sb.Append("{\"day\":" + accessWeeksTemp[i].Monday + "},");
                    sb.Append("{\"day\":" + accessWeeksTemp[i].Tuesday + "},");
                    sb.Append("{\"day\":" + accessWeeksTemp[i].Wednesday + "},");
                    sb.Append("{\"day\":" + accessWeeksTemp[i].Thursday + "},");
                    sb.Append("{\"day\":" + accessWeeksTemp[i].Friday + "},");
                    sb.Append("{\"day\":" + accessWeeksTemp[i].Saturday + "}");
                    if (i != 7)
                    {
                        sb.Append("]},");
                    }
                    else
                    {
                        sb.Append("]}");
                    }
                }
            }
            else
            {
                return new ResponseModel
                {
                    Code = 0,
                    Result = "access_weekList list fail",
                };
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
                        transaction.Rollback();
                        return new ResponseModel { Code = 0, Result = "异常" };
                    }
                }
            }
            return new ResponseModel { Code = 200, Result = "success" };
        }
        public Access_week ynfun(List<Access_week> accessWeeksTemp,int i)
        {
            Access_week yn = null;
            for (int j = 0; j < accessWeeksTemp.Count; j++) {
                if (accessWeeksTemp[j].Id == i) {
                    yn = accessWeeksTemp[j];
                }
            }
            return yn;
        }
    }
}
