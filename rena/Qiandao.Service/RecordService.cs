using Qiandao.Model.Entity;
using Qiandao.Model.Response;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;


namespace Qiandao.Service
{
    /// <summary>
    ///record服务
    /// </summary>
    public class RecordService : IScope
    {
        private readonly object _lockObject = new object();  // 专门的锁对象
        private bool _disposed = false;  // 标记是否已释放资源
        public void Dispose()
        { }
        private readonly Db _db;
        private readonly IMapper _mapper;
        public RecordService(Db db, IMapper mapper)
        {
            _db = db ?? throw new ArgumentNullException(nameof(db));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        }



        /// <summary>
        /// 获取person
        /// </summary>
        public ResponseModel GetrecordList(string? deviceSn)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                var sqlQuery = $@"  SELECT *,
               ROW_NUMBER() OVER (ORDER BY Id DESC) AS RowNum
        FROM Records
        {(string.IsNullOrEmpty(deviceSn) ? "" : "WHERE device_serial_num LIKE '%' + @deviceSn + '%'")}
    ";
                // 创建参数列表
                var parameters = new List<SqlParameter> { };
                if (!string.IsNullOrEmpty(deviceSn))
                {
                    parameters.Add(new SqlParameter("@deviceSn", deviceSn));
                }
                // 执行查询
                var query = _db.Database.SqlQueryRaw<Record>(sqlQuery, parameters.ToArray());
                // 获取查询结果
                if (query == null)
                {
                    return new ResponseModel();
                }
                var queryResult = query.ToList();
                ResponseModel responseModel = new ResponseModel();
                responseModel.Data = new List<Record>();
                foreach (var comment in queryResult)
                {
                    responseModel.Data.Add(new Record
                    {
                        Id = comment.Id,
                        Image = comment.Image,
                        IntOut = comment.IntOut,
                        Enroll_id = comment.Enroll_id,
                        Device_serial_num = comment.Device_serial_num,
                        Event = comment.Event,
                        Mode = comment.Mode,
                        Records_time = comment.Records_time,
                        Temperature = comment.Temperature
                    });
                }
                responseModel.Code = 200;
                responseModel.Result = "Person list success";
                return responseModel;
            }
        }


        /// <summary>
        /// 获取person
        /// </summary>
        public ResponseModel GetAllLogFromDB(int page, int limit, string? deviceSn)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
              
                var skipCount = (page-1) * limit;
                // 构建动态 SQL 查询
                var sqlQuery = $@"
    WITH CTE AS (
        SELECT *,
               ROW_NUMBER() OVER (ORDER BY Id DESC) AS RowNum
        FROM Records
        {(string.IsNullOrEmpty(deviceSn) ? "" : "WHERE device_serial_num LIKE '%' + @deviceSn + '%'")}
)
    SELECT *
    FROM CTE
        WHERE RowNum BETWEEN (@SkipCount+1)  AND (@SkipCount + @Limit)";
                // 创建参数列表
                var parameters = new List<SqlParameter>
    {
        new SqlParameter("@SkipCount", skipCount),
        new SqlParameter("@Limit", limit)
    };
                if (!string.IsNullOrEmpty(deviceSn))
                {
                    parameters.Add(new SqlParameter("@deviceSn", deviceSn));
                }
                // 执行查询
                var query = _db.Database.SqlQueryRaw<Record>(sqlQuery, parameters.ToArray());
                if (query == null)
                {
                    return new ResponseModel();
                }
                // 获取查询结果
                var queryResult = query.ToList();
                ResponseModel responseModel = new ResponseModel();
                responseModel.Data = new List<Record>();
                foreach (var comment in queryResult)
                {
                    responseModel.Data.Add(new Record
                    {
                        Id = comment.Id,
                        Image = comment.Image,
                        IntOut = comment.IntOut,
                        Enroll_id = comment.Enroll_id,
                        Device_serial_num = comment.Device_serial_num,
                        Event = comment.Event,
                        Mode = comment.Mode,
                        Records_time = comment.Records_time,
                        Temperature = comment.Temperature
                    });
                }

                responseModel.Code = 200;
                responseModel.Result = "record list success";
                return responseModel;
            }
        }
        public ResponseModel Deleterecord(int recordID)
        {
            lock (_lockObject)  // 确保同一时间只有一个线程访问
            {
                var record = _db.record.Find(recordID);
                if (record == null)
                    return new ResponseModel() { Code = 0, Result = "record is none" };
                _db.record.Remove(record);
                int i = _db.SaveChanges();
                if (i > 0)
                    return new ResponseModel { Code = 200, Result = "record delete success" };

                return new ResponseModel { Code = 0, Result = "record delete fail" };
            }
        }
        public async Task<ResponseModel> Insert(Record record)
        {
            using (var semaphore = new SemaphoreSlim(1, 1))
            {
                await semaphore.WaitAsync();  // 异步等待
                string sql = "INSERT INTO records (Device_serial_num, Enroll_id, Event, IntOut, Mode, Records_time, Temperature";
                string values = ") VALUES (@Device_serial_num, @Enroll_id, @Event, @IntOut, @Mode, @Records_time, @Temperature";

                var parameters = new List<SqlParameter>
        {
            new SqlParameter("@Device_serial_num", record.Device_serial_num),
            new SqlParameter("@Enroll_id", record.Enroll_id),
            new SqlParameter("@Event", record.Event),
            new SqlParameter("@IntOut", record.IntOut),
            new SqlParameter("@Mode", record.Mode),
            new SqlParameter("@Records_time", record.Records_time),
            new SqlParameter("@Temperature", record.Temperature)
        };

                if (!string.IsNullOrEmpty(record.Image))
                {
                    sql += ", Image";
                    values += ", @Image";
                    parameters.Add(new SqlParameter("@Image", record.Image));
                }
                else
                {
                    parameters.Add(new SqlParameter("@Image", DBNull.Value));
                }

                sql += values + ")";

                int i = _db.Database.ExecuteSqlRaw(sql, parameters.ToArray());
                semaphore.Release();  // 释放信号量

                if (i > 0)
                    return new ResponseModel { Code = 200, Result = "record insert success" };
                return new ResponseModel { Code = 0, Result = "record insert fail" };
            }
        }
    }
}
