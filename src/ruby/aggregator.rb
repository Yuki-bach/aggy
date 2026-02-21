class Aggregator
  def initialize(payload)
    @data       = payload['data']
    @columns    = payload['columns']
    @weight_col = payload['weight_col']
    @mode       = payload['mode'] || 'gt'
    @cross_cols = payload['cross_cols'] || []
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

  def weighted_count(subset)
    if @weight_col && !@weight_col.empty?
      subset.sum { |r| (r[@weight_col] || 0).to_f }
    else
      subset.size.to_f
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

      row_values = sorted.map { |k, _| k }

      result = {
        'col'  => col,
        'type' => 'SA',
        'n'    => n,
        'rows' => sorted.map { |k, v| { 'label' => k, 'count' => v, 'pct' => n > 0 ? v / n * 100 : 0 } }
      }

      if @mode == 'cross' && @cross_cols.any?
        result['cross'] = @cross_cols.map { |cc| cross_section(col, row_values, cc) }
      end

      result
    end
  end

  def cross_section(row_col, row_values, cross_col)
    cross_values = @data
      .map { |r| r[cross_col].to_s }
      .reject(&:empty?)
      .uniq
      .sort_by { |v| Float(v) rescue v }

    headers = cross_values.map do |cv|
      subset = @data.select { |r| r[cross_col].to_s == cv }
      { 'label' => cv, 'n' => weighted_count(subset) }
    end

    rows = row_values.map do |rv|
      cells = cross_values.map.with_index do |cv, i|
        subset = @data.select { |r| r[row_col].to_s == rv && r[cross_col].to_s == cv }
        cross_n = headers[i]['n']
        count = weighted_count(subset)
        { 'count' => count, 'pct' => cross_n > 0 ? count / cross_n * 100.0 : 0 }
      end
      { 'label' => rv, 'cells' => cells }
    end

    { 'cross_col' => cross_col, 'headers' => headers, 'rows' => rows }
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
