class Aggregator
  def initialize(payload)
    @data       = payload['data']
    @columns    = payload['columns']
    @weight_col = payload['weight_col']
  end

  def run
    results = []
    results.concat(aggregate_sa)
    results.concat(aggregate_ma)
    results
  end

  private

  def total_n
    if @weight_col && !@weight_col.empty?
      @data.sum { |r| (r[@weight_col] || 0).to_f }
    else
      @data.size
    end
  end

  def aggregate_sa
    sa_cols = @columns.select { |c| c['type'] == 'sa' }
    sa_cols.map do |col_info|
      col = col_info['name']
      n = total_n
      counts = Hash.new(0.0)

      @data.each do |row|
        val = row[col]
        next if val.nil? || val.to_s.empty?
        w = (@weight_col && !@weight_col.empty?) ? (row[@weight_col] || 0).to_f : 1
        counts[val.to_s] += w
      end

      sorted = counts.sort_by do |k, _|
        Float(k) rescue k.to_s
      end

      {
        'col'  => col,
        'type' => 'SA',
        'n'    => n,
        'rows' => sorted.map { |k, v| { 'label' => k, 'count' => v, 'pct' => n > 0 ? v / n * 100 : 0 } }
      }
    end
  end

  def aggregate_ma
    groups = {}
    @columns.each do |c|
      next unless c['type'] == 'ma' && c['ma_group']
      (groups[c['ma_group']] ||= []) << c['name']
    end

    groups.map do |prefix, cols|
      n = total_n
      rows = cols.map do |col|
        count = 0.0
        @data.each do |row|
          val = row[col]
          if val.to_s == '1' || val.to_s == 'true'
            w = (@weight_col && !@weight_col.empty?) ? (row[@weight_col] || 0).to_f : 1
            count += w
          end
        end
        { 'label' => col, 'count' => count, 'pct' => n > 0 ? count / n * 100 : 0 }
      end

      { 'col' => prefix, 'type' => 'MA', 'n' => n, 'rows' => rows }
    end
  end
end
